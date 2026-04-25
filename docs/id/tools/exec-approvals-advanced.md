---
read_when:
    - Mengonfigurasi safe bins atau profil safe-bin kustom
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau channel chat lainnya
    - Mengimplementasikan klien persetujuan native untuk sebuah channel
summary: 'Persetujuan exec lanjutan: safe bins, binding interpreter, penerusan persetujuan, pengiriman native'
title: Persetujuan exec — lanjutan
x-i18n:
    generated_at: "2026-04-25T13:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Topik persetujuan exec lanjutan: fast-path `safeBins`, binding interpreter/runtime,
dan penerusan persetujuan ke channel chat (termasuk pengiriman native).
Untuk kebijakan inti dan alur persetujuan, lihat [Persetujuan exec](/id/tools/exec-approvals).

## Safe bins (hanya stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil biner **hanya stdin** (misalnya
`cut`) yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist
eksplisit. Safe bins menolak argumen file posisional dan token mirip path, sehingga
mereka hanya dapat beroperasi pada stream masuk. Perlakukan ini sebagai fast-path sempit untuk
filter stream, bukan daftar trust umum.

<Warning>
**Jangan** tambahkan biner interpreter atau runtime (misalnya `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika suatu perintah dapat mengevaluasi kode,
mengeksekusi subperintah, atau membaca file secara desain, utamakan entri allowlist eksplisit
dan tetap aktifkan prompt persetujuan. Safe bin kustom harus mendefinisikan profil eksplisit
di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bin default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak termasuk dalam daftar default. Jika Anda memilih ikut serta, pertahankan entri
allowlist eksplisit untuk alur kerja non-stdin mereka. Untuk `grep` dalam mode safe-bin,
berikan pola dengan `-e`/`--regexp`; bentuk pola posisional ditolak
agar operand file tidak dapat diselundupkan sebagai argumen posisional yang ambigu.

### Validasi argv dan flag yang ditolak

Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host),
yang mencegah perilaku oracle keberadaan file dari perbedaan allow/deny. Opsi berorientasi file
ditolak untuk safe bin default; opsi panjang divalidasi dengan fail-closed
(flag yang tidak dikenal dan singkatan ambigu ditolak).

Flag yang ditolak menurut profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins juga memaksa token argv diperlakukan sebagai **teks literal** saat eksekusi
(tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya stdin, sehingga pola
seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file.

### Direktori biner tepercaya

Safe bins harus di-resolve dari direktori biner tepercaya (default sistem ditambah
opsional `tools.exec.safeBinTrustedDirs`). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori tepercaya default sengaja dibuat minimal: `/bin`, `/usr/bin`. Jika
executable safe-bin Anda berada di path package-manager/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara
eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Perangkaian shell, wrapper, dan multiplexer

Perangkaian shell (`&&`, `||`, `;`) diizinkan bila setiap segmen tingkat atas
memenuhi allowlist (termasuk safe bins atau auto-allow skill). Redirection
tetap tidak didukung dalam mode allowlist. Command substitution (`$()` / backtick) adalah
ditolak selama parsing allowlist, termasuk di dalam tanda kutip ganda; gunakan tanda kutip tunggal jika Anda memerlukan teks `$()` literal.

Pada persetujuan companion-app macOS, teks shell mentah yang berisi sintaks kontrol atau
ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan
sebagai allowlist miss kecuali biner shell itu sendiri di-allowlist.

Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env yang dicakup permintaan
direduksi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode allowlist, wrapper dispatch yang dikenal (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable bagian dalam, bukan
path wrapper. Multiplexer shell (`busybox`, `toybox`) di-unwrapped untuk
applet shell (`sh`, `ash`, dst.) dengan cara yang sama. Jika suatu wrapper atau multiplexer
tidak dapat di-unwrapped dengan aman, tidak ada entri allowlist yang dipertahankan secara otomatis.

Jika Anda meng-allowlist interpreter seperti `python3` atau `node`, utamakan
`tools.exec.strictInlineEval=true` agar eval inline tetap memerlukan persetujuan
eksplisit. Dalam mode ketat, `allow-always` masih dapat mempertahankan
pemanggilan interpreter/script yang aman, tetapi carrier inline-eval tidak dipertahankan
secara otomatis.

### Safe bins versus allowlist

| Topik            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Tujuan           | Izinkan otomatis filter stdin yang sempit              | Mempercayai executable tertentu secara eksplisit                                    |
| Tipe pencocokan  | Nama executable + kebijakan argv safe-bin              | Glob path executable yang di-resolve, atau glob nama perintah kosong untuk perintah yang dipanggil via PATH |
| Cakupan argumen  | Dibatasi oleh profil safe-bin dan aturan token literal | Hanya pencocokan path; argumen selebihnya menjadi tanggung jawab Anda              |
| Contoh umum      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom                                       |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline     | Tool apa pun dengan perilaku atau efek samping yang lebih luas                     |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agent `agents.list[].tools.exec.safeBinProfiles`). Key profil per-agent menimpa key global.
- Entri allowlist berada di `~/.openclaw/exec-approvals.json` lokal-host di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memberi peringatan dengan `tools.exec.safe_bins_interpreter_unprofiled` saat biner interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Biner interpreter/runtime tidak dibuat scaffold secara otomatis.

Contoh profil kustom:
__OC_I18N_900000__
Jika Anda secara eksplisit memilih `jq` ke dalam `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin
agar `jq -n env` tidak dapat membuang environment proses host tanpa path allowlist eksplisit
atau prompt persetujuan.

## Perintah interpreter/runtime

Jalankan interpreter/runtime yang didukung persetujuan sengaja dibuat konservatif:

- Konteks argv/cwd/env yang tepat selalu diikat.
- Bentuk skrip shell langsung dan file runtime langsung diikat sebaik mungkin ke satu snapshot file lokal konkret.
- Bentuk wrapper package-manager umum yang masih di-resolve ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) di-unwrapped sebelum binding.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya skrip package, bentuk eval, rantai loader spesifik runtime, atau bentuk multi-file ambigu),
  eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang sebenarnya tidak dimilikinya.
- Untuk alur kerja tersebut, utamakan sandboxing, batas host terpisah, atau alur allowlist/penuh tepercaya
  yang eksplisit saat operator menerima semantik runtime yang lebih luas.

Saat persetujuan diperlukan, tool exec langsung mengembalikan ID persetujuan. Gunakan ID itu untuk
mengorelasikan event sistem berikutnya (`Exec finished` / `Exec denied`). Jika tidak ada keputusan yang datang sebelum
timeout, permintaan diperlakukan sebagai timeout persetujuan dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman followup

Setelah exec async yang disetujui selesai, OpenClaw mengirim giliran `agent` followup ke sesi yang sama.

- Jika target pengiriman eksternal yang valid ada (channel yang dapat dikirim plus target `to`), pengiriman followup menggunakan channel tersebut.
- Dalam alur hanya webchat atau internal-session tanpa target eksternal, pengiriman followup tetap hanya-sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa channel eksternal yang dapat di-resolve, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada channel eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya-sesi alih-alih gagal.

## Penerusan persetujuan ke channel chat

Anda dapat meneruskan prompt persetujuan exec ke channel chat mana pun (termasuk channel Plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Config:
__OC_I18N_900001__
Balas di chat:
__OC_I18N_900002__
Perintah `/approve` menangani persetujuan exec dan persetujuan Plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah ini otomatis memeriksa persetujuan Plugin sebagai gantinya.

### Penerusan persetujuan Plugin

Penerusan persetujuan Plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki
config independen sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900003__
Bentuk config identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Channel yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan
Plugin. Channel tanpa UI interaktif bersama akan fallback ke teks biasa dengan instruksi `/approve`.

### Persetujuan chat yang sama di channel mana pun

Saat permintaan persetujuan exec atau Plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama
sekarang dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk channel seperti Slack, Matrix, dan
Microsoft Teams selain alur Web UI dan terminal UI yang sudah ada.

Jalur perintah teks bersama ini menggunakan model auth channel normal untuk percakapan tersebut. Jika chat asal
sudah dapat mengirim perintah dan menerima balasan, permintaan persetujuan tidak lagi memerlukan
adapter pengiriman native terpisah hanya agar tetap tertunda.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi channel tersebut tetap menggunakan
daftar approver yang telah di-resolve untuk otorisasi bahkan saat pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi pada kegagalan "approval not found". Penolakan/error
persetujuan exec yang nyata tidak secara diam-diam dicoba ulang sebagai persetujuan Plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM approver, fanout origin-chat,
dan UX persetujuan interaktif spesifik channel di atas alur `/approve` chat yang sama bersama.

Saat kartu/tombol persetujuan native tersedia, UI native tersebut menjadi jalur utama
yang menghadap agen. Agen tidak boleh juga menggemakan perintah chat biasa
`/approve` yang duplikat kecuali hasil tool menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Model generik:

- kebijakan exec host tetap memutuskan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native otomatis mengaktifkan pengiriman DM-first saat semua kondisi berikut terpenuhi:

- channel mendukung pengiriman persetujuan native
- approver dapat di-resolve dari `execApprovals.approvers` yang eksplisit atau
  sumber fallback terdokumentasi milik channel tersebut
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya
aktif saat approver berhasil di-resolve. Pengiriman origin-chat publik tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua config persetujuan exec untuk persetujuan chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan perutean DM dan fanout channel opsional di atas alur
`/approve` chat yang sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat lain yang serupa dan dapat dikirim menggunakan model auth channel normal
  untuk `/approve` di chat yang sama
- saat klien persetujuan native aktif otomatis, target pengiriman native default adalah DM approver
- untuk Discord dan Telegram, hanya approver yang berhasil di-resolve yang dapat menyetujui atau menolak
- approver Discord dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- approver Telegram dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari config owner yang ada (`allowFrom`, ditambah `defaultTo` direct-message jika didukung)
- approver Slack dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis ID persetujuan, sehingga ID `plugin:` dapat menyelesaikan persetujuan Plugin
  tanpa lapisan fallback lokal Slack kedua
- perutean DM/channel native Matrix dan shortcut reaction menangani persetujuan exec dan Plugin;
  otorisasi Plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- peminta tidak perlu menjadi approver
- chat asal dapat menyetujui langsung dengan `/approve` saat chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan native Discord merutekan berdasarkan jenis ID persetujuan: ID `plugin:` langsung menuju
  persetujuan Plugin, sisanya menuju persetujuan exec
- tombol persetujuan native Telegram mengikuti fallback exec-ke-Plugin terbatas yang sama seperti `/approve`
- saat `target` native mengaktifkan pengiriman origin-chat, prompt persetujuan menyertakan teks perintah
- persetujuan exec yang tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan yang dikonfigurasi yang dapat menerima permintaan, prompt akan fallback ke `askFallback`

Telegram secara default menggunakan DM approver (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` saat
ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram,
OpenClaw mempertahankan topik tersebut untuk prompt persetujuan dan follow-up setelah persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900004__
Catatan keamanan:

- Mode Unix socket `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer dengan UID yang sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL singkat.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Tool exec](/id/tools/exec)
- [Mode elevated](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku auto-allow yang didukung skill
