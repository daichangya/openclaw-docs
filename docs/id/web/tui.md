---
read_when:
    - Anda menginginkan panduan TUI yang ramah pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'UI Terminal (TUI): hubungkan ke Gateway atau jalankan secara lokal dalam mode embedded'
title: TUI
x-i18n:
    generated_at: "2026-04-23T09:30:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (UI Terminal)

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

Gateway remote:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gunakan `--password` jika Gateway Anda menggunakan auth password.

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

## Yang Anda lihat

- Header: URL koneksi, agent saat ini, sesi saat ini.
- Log obrolan: pesan pengguna, balasan assistant, pemberitahuan sistem, kartu tool.
- Baris status: state koneksi/eksekusi (connecting, running, streaming, idle, error).
- Footer: state koneksi + agent + sesi + model + think/fast/verbose/trace/reasoning + jumlah token + deliver.
- Input: editor teks dengan autocomplete.

## Model mental: agent + sesi

- Agent adalah slug unik (misalnya `main`, `research`). Gateway mengekspos daftarnya.
- Sesi dimiliki oleh agent saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI memperluasnya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda berpindah ke sesi agent tersebut secara eksplisit.
- Cakupan sesi:
  - `per-sender` (default): setiap agent memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (picker bisa kosong).
- Agent + sesi saat ini selalu terlihat di footer.

## Pengiriman + delivery

- Pesan dikirim ke Gateway; pengiriman ke provider nonaktif secara default.
- Aktifkan delivery:
  - `/deliver on`
  - atau panel Settings
  - atau mulai dengan `openclaw tui --deliver`

## Picker + overlay

- Picker model: mencantumkan model yang tersedia dan menyetel override sesi.
- Picker agent: pilih agent lain.
- Picker sesi: hanya menampilkan sesi untuk agent saat ini.
- Settings: toggle deliver, perluasan output tool, dan visibilitas thinking.

## Pintasan keyboard

- Enter: kirim pesan
- Esc: batalkan eksekusi aktif
- Ctrl+C: kosongkan input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: picker model
- Ctrl+G: picker agent
- Ctrl+P: picker sesi
- Ctrl+O: toggle perluasan output tool
- Ctrl+T: toggle visibilitas thinking (memuat ulang riwayat)

## Slash command

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
- `/abort` (batalkan eksekusi aktif)
- `/settings`
- `/exit`

Hanya mode lokal:

- `/auth [provider]` membuka alur auth/login provider di dalam TUI.

Slash command Gateway lain (misalnya `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Slash command](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal di host TUI.
- TUI meminta izin sekali per sesi untuk mengizinkan eksekusi lokal; jika ditolak, `!` tetap dinonaktifkan untuk sesi tersebut.
- Perintah berjalan di shell baru yang non-interaktif dalam direktori kerja TUI (tanpa `cd`/env persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` di environment-nya.
- `!` tunggal dikirim sebagai pesan normal; spasi di awal tidak memicu exec lokal.

## Memperbaiki config dari TUI lokal

Gunakan mode lokal ketika config saat ini sudah valid dan Anda ingin
agent embedded memeriksanya di mesin yang sama, membandingkannya dengan dokumen,
dan membantu memperbaiki drift tanpa bergantung pada Gateway yang sedang berjalan.

Jika `openclaw config validate` sudah gagal, mulailah dengan `openclaw configure`
atau `openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak mem-bypass
guard config tidak valid.

Alur umum:

1. Mulai mode lokal:

```bash
openclaw chat
```

2. Tanyakan kepada agent apa yang ingin Anda periksa, misalnya:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Gunakan perintah shell lokal untuk bukti dan validasi yang tepat:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Terapkan perubahan sempit dengan `openclaw config set` atau `openclaw configure`, lalu jalankan ulang `!openclaw config validate`.
5. Jika Doctor merekomendasikan migrasi atau perbaikan otomatis, tinjau lalu jalankan `!openclaw doctor --fix`.

Tips:

- Utamakan `openclaw config set` atau `openclaw configure` daripada mengedit `openclaw.json` secara manual.
- `openclaw docs "<query>"` mencari indeks dokumen live dari mesin yang sama.
- `openclaw config validate --json` berguna saat Anda menginginkan error skema dan SecretRef/resolvability yang terstruktur.

## Output tool

- Pemanggilan tool ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O melakukan toggle antara tampilan diciutkan/diperluas.
- Saat tool berjalan, pembaruan parsial di-stream ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi assistant pada warna foreground default terminal Anda agar terminal gelap dan terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar belakang terang dan deteksi otomatis salah, setel `OPENCLAW_THEME=light` sebelum menjalankan `openclaw tui`.
- Untuk memaksa palet gelap asli, setel `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat connect, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat hingga difinalkan.
- TUI juga mendengarkan event tool agent untuk kartu tool yang lebih kaya.

## Detail koneksi

- TUI mendaftar ke Gateway sebagai `mode: "tui"`.
- Reconnect menampilkan pesan sistem; celah event ditampilkan di log.

## Opsi

- `--local`: Jalankan terhadap runtime agent embedded lokal
- `--url <url>`: URL WebSocket Gateway (default ke config atau `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (jika diperlukan)
- `--password <password>`: Password Gateway (jika diperlukan)
- `--session <key>`: Kunci sesi (default: `main`, atau `global` saat cakupannya global)
- `--deliver`: Kirim balasan assistant ke provider (default nonaktif)
- `--thinking <level>`: Timpa level thinking untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah connect
- `--timeout-ms <ms>`: Timeout agent dalam ms (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entri riwayat yang dimuat (default `200`)

Catatan: ketika Anda menyetel `--url`, TUI tidak melakukan fallback ke kredensial config atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
Dalam mode lokal, jangan berikan `--url`, `--token`, atau `--password`.

## Pemecahan Masalah

Tidak ada output setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan idle/busy.
- Periksa log Gateway: `openclaw logs --follow`.
- Konfirmasikan agent dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di saluran obrolan, aktifkan delivery (`/deliver on` atau `--deliver`).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agent di picker: periksa `openclaw agents list` dan config perutean Anda.
- Picker sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [Control UI](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Config](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan dan migrasi terpandu
- [Referensi CLI](/id/cli) — referensi lengkap perintah CLI
