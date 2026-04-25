---
read_when:
    - Menyesuaikan irama atau pesan Heartbeat
    - Memutuskan antara Heartbeat dan Cron untuk tugas terjadwal
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat vs Cron?** Lihat [Otomasi & Tugas](/id/automation) untuk panduan kapan menggunakan masing-masing.

Heartbeat menjalankan **giliran agen periodik** di sesi utama agar model dapat
menampilkan apa pun yang perlu diperhatikan tanpa mengganggu Anda dengan spam.

Heartbeat adalah giliran sesi utama yang dijadwalkan — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks).
Catatan tugas digunakan untuk pekerjaan terlepas (ACP run, subagen, pekerjaan cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

1. Biarkan heartbeat tetap aktif (default adalah `30m`, atau `1h` untuk auth Anthropic OAuth/token, termasuk reuse Claude CLI) atau atur irama Anda sendiri.
2. Buat checklist `HEARTBEAT.md` kecil atau blok `tasks:` di ruang kerja agen (opsional tetapi disarankan).
3. Tentukan ke mana pesan heartbeat harus dikirim (`target: "none"` adalah default; atur `target: "last"` untuk merutekan ke kontak terakhir).
4. Opsional: aktifkan pengiriman reasoning heartbeat untuk transparansi.
5. Opsional: gunakan konteks bootstrap ringan jika heartbeat hanya memerlukan `HEARTBEAT.md`.
6. Opsional: aktifkan sesi terisolasi agar tidak mengirim seluruh riwayat percakapan pada setiap heartbeat.
7. Opsional: batasi heartbeat ke jam aktif (waktu lokal).

Contoh config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
        directPolicy: "allow", // default: izinkan target direct/DM; atur "block" untuk menekan
        lightContext: true, // opsional: hanya menyisipkan HEARTBEAT.md dari file bootstrap
        isolatedSession: true, // opsional: sesi baru setiap run (tanpa riwayat percakapan)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opsional: kirim juga pesan `Reasoning:` terpisah
      },
    },
  },
}
```

## Default

- Interval: `30m` (atau `1h` saat auth Anthropic OAuth/token adalah mode auth yang terdeteksi, termasuk reuse Claude CLI). Atur `agents.defaults.heartbeat.every` atau per agen `agents.list[].heartbeat.every`; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. System
  prompt menyertakan bagian “Heartbeat” hanya saat heartbeat diaktifkan untuk
  agen default, dan run ditandai secara internal.
- Saat heartbeat dinonaktifkan dengan `0m`, run normal juga menghilangkan `HEARTBEAT.md`
  dari konteks bootstrap sehingga model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa di zona waktu yang dikonfigurasi.
  Di luar jendela, heartbeat dilewati hingga tick berikutnya di dalam jendela.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: “Consider outstanding tasks” mendorong agen untuk meninjau
  tindak lanjut (kotak masuk, kalender, pengingat, pekerjaan antrean) dan menampilkan hal yang mendesak.
- **Check-in manusia**: “Checkup sometimes on your human during day time” mendorong
  pesan ringan sesekali seperti “ada yang Anda butuhkan?”, tetapi menghindari spam malam hari
  dengan menggunakan zona waktu lokal Anda yang dikonfigurasi (lihat [/concepts/timezone](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi run heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya “periksa statistik Gmail PubSub”
atau “verifikasi kesehatan gateway”), atur `agents.defaults.heartbeat.prompt` (atau
`agents.list[].heartbeat.prompt`) ke isi kustom (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Selama run heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack saat muncul
  di **awal atau akhir** balasan. Token ini dihapus dan balasan dibuang jika
  sisa kontennya **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, ini tidak diperlakukan
  secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; kembalikan hanya teks peringatan.

Di luar heartbeat, `HEARTBEAT_OK` yang tersesat di awal/akhir pesan dihapus
dan dicatat; pesan yang hanya berisi `HEARTBEAT_OK` akan dibuang.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m menonaktifkan)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (kirim pesan Reasoning: terpisah saat tersedia)
        lightContext: false, // default: false; true hanya menyisakan HEARTBEAT.md dari file bootstrap ruang kerja
        isolatedSession: false, // default: false; true menjalankan setiap heartbeat di sesi baru (tanpa riwayat percakapan)
        target: "last", // default: none | opsi: last | none | <channel id> (inti atau Plugin, mis. "bluebubbles")
        to: "+15551234567", // override khusus saluran opsional
        accountId: "ops-bot", // id saluran multi-akun opsional
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // jumlah karakter maksimum yang diizinkan setelah HEARTBEAT_OK
      },
    },
  },
}
```

### Cakupan dan prioritas

- `agents.defaults.heartbeat` menetapkan perilaku heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua saluran.
- `channels.<channel>.heartbeat` menimpa default saluran.
- `channels.<channel>.accounts.<id>.heartbeat` (saluran multi-akun) menimpa per saluran.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut**
yang menjalankan heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat`
(sehingga Anda dapat menetapkan default bersama sekali dan menimpa per agen).

Contoh: dua agen, hanya agen kedua yang menjalankan heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Contoh jam aktif

Batasi heartbeat ke jam kerja dalam zona waktu tertentu:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opsional; menggunakan userTimezone Anda jika diatur, jika tidak zona waktu host
        },
      },
    },
  },
}
```

Di luar jendela ini (sebelum jam 9 pagi atau setelah jam 10 malam Eastern), heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan normal.

### Pengaturan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola berikut:

- Hilangkan `activeHours` sepenuhnya (tanpa pembatasan jendela waktu; ini perilaku default).
- Atur jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

Jangan atur `start` dan `end` ke waktu yang sama (misalnya `08:00` ke `08:00`).
Itu diperlakukan sebagai jendela nol lebar, sehingga heartbeat selalu dilewati.

### Contoh multi-akun

Gunakan `accountId` untuk menargetkan akun tertentu pada saluran multi-akun seperti Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opsional: rute ke topik/thread tertentu
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Catatan field

- `every`: interval heartbeat (string durasi; unit default = menit).
- `model`: override model opsional untuk run heartbeat (`provider/model`).
- `includeReasoning`: saat diaktifkan, juga kirim pesan `Reasoning:` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
- `lightContext`: saat true, run heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap ruang kerja.
- `isolatedSession`: saat true, setiap heartbeat dijalankan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Perutean pengiriman tetap menggunakan konteks sesi utama.
- `session`: kunci sesi opsional untuk run heartbeat.
  - `main` (default): sesi utama agen.
  - Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
  - Format kunci sesi: lihat [Sessions](/id/concepts/session) dan [Groups](/id/channels/groups).
- `target`:
  - `last`: kirim ke saluran eksternal yang terakhir digunakan.
  - saluran eksplisit: saluran atau id Plugin yang dikonfigurasi apa pun, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
  - `none` (default): jalankan heartbeat tetapi **jangan kirim** ke luar.
- `directPolicy`: mengontrol perilaku pengiriman direct/DM:
  - `allow` (default): izinkan pengiriman heartbeat direct/DM.
  - `block`: tekan pengiriman direct/DM (`reason=dm-blocked`).
- `to`: override penerima opsional (id khusus saluran, mis. E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.
- `accountId`: id akun opsional untuk saluran multi-akun. Saat `target: "last"`, id akun berlaku pada saluran terakhir yang di-resolve jika saluran itu mendukung akun; jika tidak, akan diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk saluran yang di-resolve, pengiriman dilewati.
- `prompt`: menimpa isi prompt default (tidak digabungkan).
- `ackMaxChars`: jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan error tool selama run heartbeat.
- `activeHours`: membatasi run heartbeat ke jendela waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.
  - Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diatur, jika tidak fallback ke zona waktu sistem host.
  - `"local"`: selalu menggunakan zona waktu sistem host.
  - Identifier IANA apa pun (mis. `America/New_York`): digunakan langsung; jika tidak valid, fallback ke perilaku `"user"` di atas.
  - `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai nol lebar (selalu di luar jendela).
  - Di luar jendela aktif, heartbeat dilewati hingga tick berikutnya di dalam jendela.

## Perilaku pengiriman

- Heartbeat secara default berjalan di sesi utama agen (`agent:<id>:<mainKey>`),
  atau `global` saat `session.scope = "global"`. Atur `session` untuk menimpa ke
  sesi saluran tertentu (Discord/WhatsApp/dll.).
- `session` hanya memengaruhi konteks run; pengiriman dikendalikan oleh `target` dan `to`.
- Untuk mengirim ke saluran/penerima tertentu, atur `target` + `to`. Dengan
  `target: "last"`, pengiriman menggunakan saluran eksternal terakhir untuk sesi tersebut.
- Pengiriman heartbeat secara default mengizinkan target direct/DM. Atur `directPolicy: "block"` untuk menekan pengiriman target direct sambil tetap menjalankan giliran heartbeat.
- Jika antrean utama sibuk, heartbeat dilewati dan dicoba ulang nanti.
- Jika `target` tidak di-resolve ke tujuan eksternal mana pun, run tetap terjadi tetapi tidak ada
  pesan keluar yang dikirim.
- Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, run dilewati dari awal sebagai `reason=alerts-disabled`.
- Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw tetap dapat menjalankan heartbeat, memperbarui stempel waktu due-task, memulihkan stempel waktu idle sesi, dan menekan payload peringatan keluar.
- Jika target heartbeat yang di-resolve mendukung typing, OpenClaw menampilkan typing saat
  run heartbeat aktif. Ini menggunakan target yang sama dengan tempat heartbeat akan
  mengirim output chat, dan dinonaktifkan dengan `typingMode: "never"`.
- Balasan khusus heartbeat **tidak** membuat sesi tetap hidup; `updatedAt`
  terakhir dipulihkan sehingga kedaluwarsa idle berperilaku normal.
- Riwayat Control UI dan WebChat menyembunyikan prompt heartbeat dan
  acknowledgment khusus OK. Transkrip sesi dasarnya tetap dapat berisi giliran tersebut
  untuk audit/replay.
- [Tugas latar belakang](/id/automation/tasks) yang terlepas dapat memasukkan event sistem ke antrean dan membangunkan heartbeat saat sesi utama perlu segera menyadari sesuatu. Bangun ini tidak menjadikan run heartbeat sebagai tugas latar belakang.

## Kontrol visibilitas

Secara default, acknowledgment `HEARTBEAT_OK` ditekan sementara konten peringatan
tetap dikirim. Anda dapat menyesuaikannya per saluran atau per akun:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Sembunyikan HEARTBEAT_OK (default)
      showAlerts: true # Tampilkan pesan peringatan (default)
      useIndicator: true # Emit event indikator (default)
  telegram:
    heartbeat:
      showOk: true # Tampilkan acknowledgment OK di Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Tekan pengiriman peringatan untuk akun ini
```

Prioritas: per-akun → per-saluran → default saluran → default bawaan.

### Fungsi tiap flag

- `showOk`: mengirim acknowledgment `HEARTBEAT_OK` saat model mengembalikan balasan khusus OK.
- `showAlerts`: mengirim konten peringatan saat model mengembalikan balasan non-OK.
- `useIndicator`: mengeluarkan event indikator untuk permukaan status UI.

Jika **ketiganya** bernilai false, OpenClaw melewati run heartbeat sepenuhnya (tanpa panggilan model).

### Contoh per saluran vs per akun

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # semua akun Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # tekan peringatan hanya untuk akun ops
  telegram:
    heartbeat:
      showOk: true
```

### Pola umum

| Tujuan                                   | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, peringatan aktif) | _(tidak perlu config)_                                                              |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu saluran                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di ruang kerja, prompt default memberi tahu
agen untuk membacanya. Anggap ini sebagai “checklist heartbeat” Anda: kecil, stabil, dan
aman untuk disertakan setiap 30 menit.

Pada run normal, `HEARTBEAT.md` hanya disisipkan saat panduan heartbeat
diaktifkan untuk agen default. Menonaktifkan irama heartbeat dengan `0m` atau
mengatur `includeSystemPromptSection: false` akan menghilangkannya dari konteks bootstrap normal.

Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header markdown
seperti `# Heading`), OpenClaw melewati run heartbeat untuk menghemat panggilan API.
Lewatan ini dilaporkan sebagai `reason=empty-heartbeat-file`.
Jika file tidak ada, heartbeat tetap berjalan dan model yang memutuskan apa yang harus dilakukan.

Buat tetap kecil (checklist singkat atau pengingat) agar prompt tidak membengkak.

Contoh `HEARTBEAT.md`:

```md
# Checklist heartbeat

- Pemindaian cepat: adakah yang mendesak di kotak masuk?
- Jika siang hari, lakukan check-in ringan jika tidak ada hal lain yang tertunda.
- Jika tugas terblokir, tuliskan _apa yang kurang_ dan tanyakan ke Peter lain kali.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur kecil untuk pemeriksaan berbasis interval
di dalam heartbeat itu sendiri.

Contoh:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Periksa email belum dibaca yang mendesak dan tandai apa pun yang sensitif terhadap waktu."
- name: calendar-scan
  interval: 2h
  prompt: "Periksa rapat mendatang yang perlu persiapan atau tindak lanjut."

# Instruksi tambahan

- Buat peringatan tetap singkat.
- Jika tidak ada yang perlu diperhatikan setelah semua tugas jatuh tempo, balas HEARTBEAT_OK.
```

Perilaku:

- OpenClaw mem-parse blok `tasks:` dan memeriksa tiap tugas terhadap `interval`-nya sendiri.
- Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt heartbeat untuk tick tersebut.
- Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang sia-sia.
- Konten non-tugas di `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas yang jatuh tempo.
- Stempel waktu terakhir dijalankan tugas disimpan di status sesi (`heartbeatTaskState`), sehingga interval tetap bertahan setelah restart normal.
- Stempel waktu tugas hanya dimajukan setelah run heartbeat menyelesaikan jalur balasan normalnya. Run yang dilewati karena `empty-heartbeat-file` / `no-tasks-due` tidak menandai tugas sebagai selesai.

Mode tugas berguna saat Anda ingin satu file heartbeat memuat beberapa pemeriksaan periodik tanpa harus membayar semuanya di setiap tick.

### Bisakah agen memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file normal di ruang kerja agen, jadi Anda dapat memberi tahu
agen (dalam chat normal) sesuatu seperti:

- “Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian.”
- “Tulis ulang `HEARTBEAT.md` agar lebih singkat dan fokus pada tindak lanjut kotak masuk.”

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit di
prompt heartbeat Anda seperti: “Jika checklist mulai usang, perbarui HEARTBEAT.md
dengan versi yang lebih baik.”

Catatan keamanan: jangan masukkan rahasia (API key, nomor telepon, token privat) ke dalam
`HEARTBEAT.md` — file ini menjadi bagian dari konteks prompt.

## Bangun manual (sesuai permintaan)

Anda dapat memasukkan event sistem ke antrean dan memicu heartbeat segera dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, bangun manual akan segera menjalankan heartbeat masing-masing agen tersebut.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, heartbeat hanya mengirim payload “jawaban” akhir.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan mengirim pesan terpisah yang diawali
`Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna saat agen
mengelola beberapa sesi/codex dan Anda ingin melihat mengapa agen memutuskan untuk menghubungi
Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya biarkan nonaktif di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek menghabiskan lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` agar tidak mengirim seluruh riwayat percakapan (~100K token turun menjadi ~2-5K per run).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Atur `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Buat `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan status internal.

## Terkait

- [Otomasi & Tugas](/id/automation) — semua mekanisme otomasi secara ringkas
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan terlepas dilacak
- [Zona Waktu](/id/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan heartbeat
- [Pemecahan masalah](/id/automation/cron-jobs#troubleshooting) — debugging masalah otomasi
