---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan default suara realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-25T13:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

Dukungan peserta Google Meet untuk OpenClaw — Plugin ini sengaja dibuat eksplisit:

- Plugin ini hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Plugin ini dapat membuat ruang Meet baru melalui Google Meet API, lalu bergabung ke
  URL yang dikembalikan.
- Suara `realtime` adalah mode default.
- Suara realtime dapat memanggil kembali ke agen OpenClaw penuh saat penalaran
  yang lebih dalam atau alat dibutuhkan.
- Agen memilih perilaku bergabung dengan `mode`: gunakan `realtime` untuk
  dengar/balas langsung secara live, atau `transcribe` untuk bergabung/mengendalikan browser tanpa
  jembatan suara realtime.
- Auth dimulai sebagai OAuth Google pribadi atau profil Chrome yang sudah login.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau pada host node yang telah dipair.
- Twilio menerima nomor dial-in plus PIN opsional atau urutan DTMF.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur kerja
  telekonferensi agen yang lebih luas.

## Mulai cepat

Pasang dependensi audio lokal dan konfigurasikan penyedia suara realtime backend.
OpenAI adalah default; Google Gemini Live juga berfungsi dengan
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` memasang perangkat audio virtual `BlackHole 2ch`. Installer
Homebrew memerlukan reboot sebelum macOS mengekspos perangkat tersebut:

```bash
sudo reboot
```

Setelah reboot, verifikasi kedua komponen:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Aktifkan Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Periksa penyiapan:

```bash
openclaw googlemeet setup
```

Output penyiapan dimaksudkan agar dapat dibaca agen. Output ini melaporkan profil Chrome,
jembatan audio, pinning node, intro realtime yang tertunda, dan, saat delegasi Twilio
dikonfigurasi, apakah Plugin `voice-call` dan kredensial Twilio sudah siap.
Perlakukan setiap pemeriksaan `ok: false` sebagai penghambat sebelum meminta agen bergabung.
Gunakan `openclaw googlemeet setup --json` untuk script atau output yang dapat dibaca mesin.

Bergabung ke rapat:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Atau biarkan agen bergabung melalui alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Buat rapat baru dan bergabung ke sana:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Buat hanya URL tanpa bergabung:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` memiliki dua jalur:

- Pembuatan API: digunakan saat kredensial OAuth Google Meet dikonfigurasi. Ini
  adalah jalur paling deterministik dan tidak bergantung pada status UI browser.
- Fallback browser: digunakan saat kredensial OAuth tidak ada. OpenClaw menggunakan
  node Chrome yang dipin, membuka `https://meet.google.com/new`, menunggu Google
  mengalihkan ke URL kode rapat yang nyata, lalu mengembalikan URL tersebut. Jalur ini memerlukan
  profil Chrome OpenClaw pada node sudah login ke Google.
  Otomatisasi browser menangani prompt mikrofon pertama Meet; prompt itu
  tidak diperlakukan sebagai kegagalan login Google.
  Alur join dan create juga mencoba menggunakan ulang tab Meet yang sudah ada sebelum membuka
  yang baru. Pencocokan mengabaikan query string URL yang tidak berbahaya seperti `authuser`, sehingga
  retry agen seharusnya memfokuskan rapat yang sudah terbuka alih-alih membuat tab Chrome kedua.

Output perintah/alat mencakup field `source` (`api` atau `browser`) sehingga agen
dapat menjelaskan jalur mana yang digunakan. `create` secara default bergabung ke rapat baru
dan mengembalikan `joined: true` plus sesi join. Untuk hanya membuat URL,
gunakan `create --no-join` di CLI atau berikan `"join": false` ke alat.

Atau beri tahu agen: "Buat Google Meet, gabung dengan suara realtime, dan kirim
tautannya kepada saya." Agen seharusnya memanggil `google_meet` dengan `action: "create"` lalu
membagikan `meetingUri` yang dikembalikan.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Untuk join hanya-observe/kontrol-browser, atur `"mode": "transcribe"`. Ini
tidak memulai jembatan model realtime duplex, sehingga tidak akan berbicara kembali ke
rapat.

Selama sesi realtime, status `google_meet` mencakup kesehatan browser dan jembatan audio
seperti `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp input/output terakhir, penghitung byte, dan status bridge closed. Jika prompt halaman Meet yang aman muncul, otomatisasi browser menanganinya jika bisa. Login, penerimaan host, dan prompt izin browser/OS dilaporkan sebagai tindakan manual dengan alasan dan pesan untuk diteruskan agen.

Chrome bergabung sebagai profil Chrome yang sedang login. Di Meet, pilih `BlackHole 2ch` untuk
jalur mikrofon/speaker yang digunakan OpenClaw. Untuk audio duplex yang bersih, gunakan
perangkat virtual terpisah atau graph bergaya Loopback; satu perangkat BlackHole sudah
cukup untuk smoke test pertama tetapi dapat menimbulkan gema.

### Gateway lokal + Chrome Parallels

Anda **tidak** memerlukan Gateway OpenClaw penuh atau key API model di dalam VM macOS
hanya agar VM memiliki Chrome. Jalankan Gateway dan agen secara lokal, lalu jalankan
host node di VM. Aktifkan Plugin bawaan di VM sekali agar node mengiklankan perintah Chrome:

Yang berjalan di mana:

- Host Gateway: Gateway OpenClaw, workspace agen, key model/API, penyedia realtime,
  dan konfigurasi Plugin Google Meet.
- VM macOS Parallels: CLI/host node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang login ke Google.
- Tidak diperlukan di VM: layanan Gateway, konfigurasi agen, key OpenAI/GPT, atau
  penyiapan penyedia model.

Pasang dependensi VM:

```bash
brew install blackhole-2ch sox
```

Reboot VM setelah memasang BlackHole agar macOS mengekspos `BlackHole 2ch`:

```bash
sudo reboot
```

Setelah reboot, verifikasi VM dapat melihat perangkat audio dan perintah SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Pasang atau perbarui OpenClaw di VM, lalu aktifkan Plugin bawaan di sana:

```bash
openclaw plugins enable google-meet
```

Mulai host node di VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jika `<gateway-host>` adalah IP LAN dan Anda tidak menggunakan TLS, node menolak
WebSocket plaintext kecuali Anda ikut serta untuk jaringan privat tepercaya itu:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gunakan variabel environment yang sama saat memasang node sebagai LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` adalah process environment, bukan
pengaturan `openclaw.json`. `openclaw node install` menyimpannya di environment LaunchAgent
saat ada pada perintah install.

Setujui node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Konfirmasi Gateway melihat node dan bahwa node mengiklankan `googlemeet.chrome`
dan kemampuan browser/`browser.proxy`:

```bash
openclaw nodes status
```

Rutekan Meet melalui node tersebut pada host Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Sekarang bergabung seperti biasa dari host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

atau minta agen menggunakan alat `google_meet` dengan `transport: "chrome-node"`.

Untuk smoke test satu perintah yang membuat atau menggunakan ulang sesi, mengucapkan
frasa yang diketahui, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama proses bergabung, otomatisasi browser OpenClaw mengisi nama tamu, mengklik Join/Ask
to join, dan menerima pilihan "Use microphone" pertama Meet saat prompt
muncul. Selama pembuatan rapat browser-only, OpenClaw juga dapat melanjutkan melewati
prompt yang sama tanpa mikrofon jika Meet tidak menampilkan tombol use-microphone.
Jika profil browser belum login, Meet sedang menunggu
penerimaan host, Chrome membutuhkan izin mikrofon/kamera, atau Meet terhenti pada
prompt yang tidak dapat diselesaikan otomatisasi, hasil join/test-speech melaporkan
`manualActionRequired: true` dengan `manualActionReason` dan
`manualActionMessage`. Agen seharusnya berhenti mencoba ulang join, melaporkan pesan persis
tersebut plus `browserUrl`/`browserTitle` saat ini, dan mencoba ulang hanya setelah
tindakan browser manual selesai.

Jika `chromeNode.node` tidak diisi, OpenClaw memilih otomatis hanya ketika tepat satu
node terhubung mengiklankan `googlemeet.chrome` dan kontrol browser. Jika
beberapa node yang mampu terhubung, atur `chromeNode.node` ke id node,
nama tampilan, atau IP remote.

Pemeriksaan kegagalan umum:

- `No connected Google Meet-capable node`: jalankan `openclaw node run` di VM,
  setujui pairing, dan pastikan `openclaw plugins enable google-meet` serta
  `openclaw plugins enable browser` telah dijalankan di VM. Konfirmasikan juga host
  Gateway mengizinkan kedua perintah node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: pasang `blackhole-2ch`
  di VM dan reboot VM.
- Chrome terbuka tetapi tidak bisa bergabung: login ke profil browser di dalam VM, atau
  pertahankan `chrome.guestName` agar join sebagai tamu. Auto-join tamu menggunakan
  otomatisasi browser OpenClaw melalui proxy browser node; pastikan konfigurasi browser node
  menunjuk ke profil yang Anda inginkan, misalnya
  `browser.defaultProfile: "user"` atau profil existing-session bernama.
- Tab Meet duplikat: biarkan `chrome.reuseExistingTab: true` tetap aktif. OpenClaw
  mengaktifkan tab yang sudah ada untuk URL Meet yang sama sebelum membuka tab baru, dan
  pembuatan rapat browser menggunakan ulang `https://meet.google.com/new` yang sedang berlangsung
  atau tab prompt akun Google sebelum membuka yang lain.
- Tidak ada audio: di Meet, rutekan mikrofon/speaker melalui jalur perangkat audio virtual
  yang digunakan OpenClaw; gunakan perangkat virtual terpisah atau perutean
  bergaya Loopback untuk audio duplex yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua alat eksternal:

- `sox`: utilitas audio command-line. Plugin menggunakan perintah `rec` dan `play`
  untuk jembatan audio default 8 kHz G.711 mu-law.
- `blackhole-2ch`: driver audio virtual macOS. Ini membuat perangkat audio `BlackHole 2ch`
  yang dapat digunakan Chrome/Meet untuk perutean.

OpenClaw tidak membundel atau mendistribusikan ulang salah satu paket tersebut. Dokumentasi meminta pengguna
memasangnya sebagai dependensi host melalui Homebrew. Lisensi SoX adalah
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole adalah GPL-3.0. Jika Anda membangun
installer atau appliance yang membundel BlackHole bersama OpenClaw, tinjau ketentuan lisensi
upstream BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet di Google Chrome dan bergabung sebagai profil
Chrome yang sedang login. Di macOS, Plugin memeriksa `BlackHole 2ch` sebelum peluncuran.
Jika dikonfigurasi, Plugin juga menjalankan perintah pemeriksaan kesehatan jembatan audio dan perintah startup
sebelum membuka Chrome. Gunakan `chrome` saat Chrome/audio berada di host Gateway;
gunakan `chrome-node` saat Chrome/audio berada di node yang telah dipair seperti VM
macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Rutekan audio mikrofon dan speaker Chrome melalui jembatan audio OpenClaw lokal. Jika `BlackHole 2ch` tidak terpasang, join gagal dengan error penyiapan alih-alih diam-diam bergabung tanpa jalur audio.

### Twilio

Transport Twilio adalah rencana panggilan ketat yang didelegasikan ke Plugin Voice Call. Transport ini tidak mengurai halaman Meet untuk mencari nomor telepon.

Gunakan ini saat partisipasi Chrome tidak tersedia atau Anda menginginkan fallback dial-in telepon. Google Meet harus mengekspos nomor dial-in telepon dan PIN untuk
rapat; OpenClaw tidak menemukannya dari halaman Meet.

Aktifkan Plugin Voice Call pada host Gateway, bukan pada node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // atau atur "twilio" jika Twilio harus menjadi default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Sediakan kredensial Twilio melalui environment atau konfigurasi. Environment menjaga
secret tetap di luar `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Restart atau reload Gateway setelah mengaktifkan `voice-call`; perubahan konfigurasi Plugin
tidak muncul dalam proses Gateway yang sudah berjalan sampai proses tersebut di-reload.

Lalu verifikasi:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Saat delegasi Twilio sudah terhubung, `googlemeet setup` mencakup pemeriksaan
`twilio-voice-call-plugin` dan `twilio-voice-call-credentials` yang berhasil.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gunakan `--dtmf-sequence` saat rapat memerlukan urutan kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth dan preflight

OAuth bersifat opsional untuk membuat tautan Meet karena `googlemeet create` dapat fallback
ke otomatisasi browser. Konfigurasikan OAuth saat Anda menginginkan pembuatan API resmi,
resolusi ruang, atau pemeriksaan preflight Meet Media API.

Akses Google Meet API menggunakan OAuth pengguna: buat klien OAuth Google Cloud,
minta scope yang diperlukan, otorisasi akun Google, lalu simpan
refresh token yang dihasilkan dalam konfigurasi Plugin Google Meet atau sediakan
variabel environment `OPENCLAW_GOOGLE_MEET_*`.

OAuth tidak menggantikan jalur join Chrome. Transport Chrome dan Chrome-node
tetap bergabung melalui profil Chrome yang sudah login, BlackHole/SoX, dan node
yang terhubung saat Anda menggunakan partisipasi browser. OAuth hanya untuk jalur Google
Meet API resmi: membuat ruang rapat, meresolusikan ruang, dan menjalankan pemeriksaan preflight Meet Media API.

### Buat kredensial Google

Di Google Cloud Console:

1. Buat atau pilih proyek Google Cloud.
2. Aktifkan **Google Meet REST API** untuk proyek tersebut.
3. Konfigurasikan layar persetujuan OAuth.
   - **Internal** adalah yang paling sederhana untuk organisasi Google Workspace.
   - **External** berfungsi untuk penyiapan pribadi/pengujian; selama aplikasi berada dalam mode Testing,
     tambahkan setiap akun Google yang akan mengotorisasi aplikasi sebagai pengguna uji.
4. Tambahkan scope yang diminta OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Buat ID klien OAuth.
   - Jenis aplikasi: **Web application**.
   - URI redirect yang diotorisasi:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Salin client ID dan client secret.

`meetings.space.created` diwajibkan oleh Google Meet `spaces.create`.
`meetings.space.readonly` memungkinkan OpenClaw meresolusikan URL/kode Meet ke ruang.
`meetings.conference.media.readonly` digunakan untuk preflight Meet Media API dan pekerjaan media;
Google dapat mewajibkan pendaftaran Developer Preview untuk penggunaan Media API yang sebenarnya.
Jika Anda hanya memerlukan join Chrome berbasis browser, lewati OAuth sepenuhnya.

### Buat refresh token

Konfigurasikan `oauth.clientId` dan opsional `oauth.clientSecret`, atau berikan keduanya sebagai
variabel environment, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah ini mencetak blok konfigurasi `oauth` dengan refresh token. Perintah ini menggunakan PKCE,
callback localhost pada `http://localhost:8085/oauth2callback`, dan alur
salin/tempel manual dengan `--manual`.

Contoh:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Gunakan mode manual saat browser tidak dapat menjangkau callback lokal:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Output JSON mencakup:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Simpan objek `oauth` di bawah konfigurasi Plugin Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Utamakan variabel environment saat Anda tidak ingin refresh token berada di konfigurasi.
Jika nilai konfigurasi dan environment sama-sama ada, Plugin me-resolve konfigurasi
terlebih dahulu lalu fallback ke environment.

Persetujuan OAuth mencakup pembuatan ruang Meet, akses baca ruang Meet, dan akses baca media konferensi
Meet. Jika Anda mengautentikasi sebelum dukungan pembuatan rapat
tersedia, jalankan ulang `openclaw googlemeet auth login --json` agar refresh
token memiliki scope `meetings.space.created`.

### Verifikasi OAuth dengan doctor

Jalankan OAuth doctor saat Anda menginginkan pemeriksaan kesehatan yang cepat dan tidak membocorkan secret:

```bash
openclaw googlemeet doctor --oauth --json
```

Perintah ini tidak memuat runtime Chrome atau memerlukan node Chrome yang terhubung. Perintah ini
memeriksa bahwa konfigurasi OAuth ada dan bahwa refresh token dapat membuat access
token. Laporan JSON hanya mencakup field status seperti `ok`, `configured`,
`tokenSource`, `expiresAt`, dan pesan pemeriksaan; perintah ini tidak mencetak access
token, refresh token, atau client secret.

Hasil umum:

| Pemeriksaan          | Arti                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, atau access token yang di-cache, ada.       |
| `oauth-token`        | Access token yang di-cache masih valid, atau refresh token telah membuat access token baru. |
| `meet-spaces-get`    | Pemeriksaan opsional `--meeting` meresolusikan ruang Meet yang ada.                      |
| `meet-spaces-create` | Pemeriksaan opsional `--create-space` membuat ruang Meet baru.                           |

Untuk membuktikan pengaktifan Google Meet API dan scope `spaces.create` juga, jalankan
pemeriksaan create yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` membuat URL Meet sementara. Gunakan ini saat Anda perlu memastikan
bahwa proyek Google Cloud telah mengaktifkan Meet API dan bahwa akun yang diotorisasi
memiliki scope `meetings.space.created`.

Untuk membuktikan akses baca ke ruang rapat yang ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` dan `resolve-space` membuktikan akses baca ke ruang
yang ada yang dapat diakses akun Google yang diotorisasi. `403` dari pemeriksaan ini
biasanya berarti Google Meet REST API dinonaktifkan, refresh token yang disetujui
tidak memiliki scope yang diperlukan, atau akun Google tidak dapat mengakses ruang Meet
tersebut. Error refresh-token berarti jalankan ulang `openclaw googlemeet auth login
--json` dan simpan blok `oauth` yang baru.

Tidak diperlukan kredensial OAuth untuk fallback browser. Dalam mode itu, auth Google
berasal dari profil Chrome yang sudah login pada node yang dipilih, bukan dari
konfigurasi OpenClaw.

Variabel environment ini diterima sebagai fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` atau `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` atau `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` atau
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` atau `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` atau `GOOGLE_MEET_PREVIEW_ACK`

Resolusikan URL, kode, atau `spaces/{id}` Meet melalui `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Jalankan preflight sebelum pekerjaan media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Daftar artefak rapat dan kehadiran setelah Meet membuat record konferensi:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Dengan `--meeting`, `artifacts` dan `attendance` menggunakan record konferensi terbaru
secara default. Berikan `--all-conference-records` saat Anda menginginkan setiap record yang
dipertahankan untuk rapat tersebut.

Lookup Calendar dapat meresolusikan URL rapat dari Google Calendar sebelum membaca
artefak Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` mencari Calendar `primary` hari ini untuk event Calendar dengan
tautan Google Meet. Gunakan `--event <query>` untuk mencari teks event yang cocok, dan
`--calendar <id>` untuk Calendar non-primary. Lookup Calendar memerlukan
login OAuth baru yang mencakup scope readonly event Calendar.
`calendar-events` mempratinjau event Meet yang cocok dan menandai event yang akan dipilih
oleh `latest`, `artifacts`, `attendance`, atau `export`.

Jika Anda sudah mengetahui id record konferensi, targetkan langsung:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Tulis laporan yang mudah dibaca:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` mengembalikan metadata record konferensi plus metadata resource peserta, rekaman,
transkrip, entri transkrip terstruktur, dan smart-note saat
Google mengeksposnya untuk rapat tersebut. Gunakan `--no-transcript-entries` untuk melewati
lookup entri pada rapat besar. `attendance` memperluas peserta menjadi
baris sesi-peserta dengan waktu pertama/terakhir terlihat, total durasi sesi,
flag terlambat/pergi lebih awal, dan resource peserta duplikat yang digabungkan berdasarkan pengguna yang login
atau nama tampilan. Berikan `--no-merge-duplicates` untuk mempertahankan resource peserta mentah
tetap terpisah, `--late-after-minutes` untuk menyesuaikan deteksi keterlambatan, dan
`--early-before-minutes` untuk menyesuaikan deteksi pergi lebih awal.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`.
`manifest.json` mencatat input yang dipilih, opsi ekspor, record konferensi,
file output, jumlah, sumber token, event Calendar saat digunakan, dan peringatan pengambilan parsial apa pun. Berikan `--zip` untuk juga menulis arsip portabel di samping
folder. Berikan `--include-doc-bodies` untuk mengekspor teks Google Docs transkrip tertaut
dan smart-note melalui Google Drive `files.export`; ini memerlukan login OAuth baru yang mencakup scope readonly Drive Meet. Tanpa
`--include-doc-bodies`, ekspor hanya mencakup metadata Meet dan entri transkrip terstruktur.
Jika Google mengembalikan kegagalan artefak parsial, seperti error listing smart-note,
entri transkrip, atau isi dokumen Drive, ringkasan dan
manifest mempertahankan peringatan itu alih-alih menggagalkan seluruh ekspor.
Gunakan `--dry-run` untuk mengambil data artefak/kehadiran yang sama dan mencetak
JSON manifest tanpa membuat folder atau ZIP. Ini berguna sebelum menulis
ekspor besar atau saat agen hanya memerlukan jumlah, record terpilih, dan
peringatan.

Agen juga dapat membuat bundle yang sama melalui alat `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Atur `"dryRun": true` untuk hanya mengembalikan manifest ekspor dan melewati penulisan file.

Jalankan smoke live yang dijaga terhadap rapat nyata yang dipertahankan:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Environment smoke live:

- `OPENCLAW_LIVE_TEST=1` mengaktifkan live test yang dijaga.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` menunjuk ke URL, kode, atau
  `spaces/{id}` Meet yang dipertahankan.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID` menyediakan OAuth
  client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN` menyediakan
  refresh token.
- Opsional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, dan
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` menggunakan nama fallback yang sama
  tanpa prefiks `OPENCLAW_`.

Smoke live artefak/kehadiran dasar memerlukan
`https://www.googleapis.com/auth/meetings.space.readonly` dan
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Lookup Calendar
memerlukan `https://www.googleapis.com/auth/calendar.events.readonly`. Ekspor isi dokumen Drive
memerlukan
`https://www.googleapis.com/auth/drive.meet.readonly`.

Buat ruang Meet baru:

```bash
openclaw googlemeet create
```

Perintah ini mencetak `meeting uri` baru, source, dan sesi join. Dengan kredensial OAuth
perintah ini menggunakan Google Meet API resmi. Tanpa kredensial OAuth perintah ini
menggunakan profil browser yang login pada node Chrome yang dipin sebagai fallback. Agen dapat
menggunakan alat `google_meet` dengan `action: "create"` untuk membuat dan bergabung dalam satu
langkah. Untuk pembuatan hanya-URL, berikan `"join": false`.

Contoh output JSON dari fallback browser:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Jika fallback browser menemui login Google atau penghambat izin Meet sebelum
dapat membuat URL, metode Gateway mengembalikan respons gagal dan alat
`google_meet` mengembalikan detail terstruktur alih-alih string biasa:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Saat agen melihat `manualActionRequired: true`, agen seharusnya melaporkan
`manualActionMessage` ditambah konteks node/tab browser dan berhenti membuka tab
Meet baru hingga operator menyelesaikan langkah browser tersebut.

Contoh output JSON dari pembuatan API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Membuat Meet secara default juga bergabung. Transport Chrome atau Chrome-node tetap
memerlukan profil Google Chrome yang login untuk bergabung melalui browser. Jika
profil logout, OpenClaw melaporkan `manualActionRequired: true` atau
error fallback browser dan meminta operator menyelesaikan login Google sebelum
mencoba lagi.

Atur `preview.enrollmentAcknowledged: true` hanya setelah memastikan proyek Cloud, principal OAuth, dan peserta rapat Anda telah terdaftar dalam Google
Workspace Developer Preview Program untuk Meet media API.

## Konfigurasi

Jalur realtime Chrome yang umum hanya memerlukan Plugin diaktifkan, BlackHole, SoX,
dan key penyedia suara realtime backend. OpenAI adalah default; atur
`realtime.provider: "google"` untuk menggunakan Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Atur konfigurasi Plugin di bawah `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Default:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nama/IP node opsional untuk `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nama yang digunakan pada layar tamu Meet saat logout
- `chrome.autoJoin: true`: best-effort mengisi nama tamu dan klik Join Now
  melalui otomatisasi browser OpenClaw pada `chrome-node`
- `chrome.reuseExistingTab: true`: aktifkan tab Meet yang sudah ada alih-alih
  membuka duplikat
- `chrome.waitForInCallMs: 20000`: tunggu hingga tab Meet melaporkan sudah in-call
  sebelum intro realtime dipicu
- `chrome.audioInputCommand`: perintah SoX `rec` yang menulis audio 8 kHz G.711 mu-law
  ke stdout
- `chrome.audioOutputCommand`: perintah SoX `play` yang membaca audio 8 kHz G.711 mu-law
  dari stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan
  `openclaw_agent_consult` untuk jawaban yang lebih mendalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat jembatan realtime
  terhubung; atur ke `""` untuk bergabung secara senyap

Override opsional:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Konfigurasi khusus Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` secara default bernilai `true`; dengan transport Twilio, ini mendelegasikan
panggilan PSTN aktual dan DTMF ke Plugin Voice Call. Jika `voice-call` tidak
diaktifkan, Google Meet masih dapat memvalidasi dan mencatat rencana panggilan, tetapi tidak dapat
melakukan panggilan Twilio.

## Alat

Agen dapat menggunakan alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Gunakan `transport: "chrome"` saat Chrome berjalan pada host Gateway. Gunakan
`transport: "chrome-node"` saat Chrome berjalan pada node yang telah dipair seperti VM
Parallels. Dalam kedua kasus, model realtime dan `openclaw_agent_consult` berjalan pada
host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa id sesi. Gunakan
`action: "speak"` dengan `sessionId` dan `message` agar agen realtime
langsung berbicara. Gunakan `action: "test_speech"` untuk membuat atau menggunakan ulang sesi,
memicu frasa yang diketahui, dan mengembalikan kesehatan `inCall` saat host Chrome dapat
melaporkannya. Gunakan `action: "leave"` untuk menandai sesi telah berakhir.

`status` mencakup kesehatan Chrome bila tersedia:

- `inCall`: Chrome tampaknya sedang berada di dalam panggilan Meet
- `micMuted`: status mikrofon Meet best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  browser memerlukan login manual, penerimaan host Meet, izin, atau
  perbaikan kontrol browser sebelum suara dapat bekerja
- `providerConnected` / `realtimeReady`: status jembatan suara realtime
- `lastInputAt` / `lastOutputAt`: audio terakhir yang terlihat dari atau dikirim ke jembatan

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultasi agen realtime

Mode realtime Chrome dioptimalkan untuk loop suara live. Penyedia suara realtime
mendengar audio rapat dan berbicara melalui jembatan audio yang dikonfigurasi.
Ketika model realtime membutuhkan penalaran yang lebih dalam, informasi terkini, atau alat OpenClaw normal, model itu dapat memanggil `openclaw_agent_consult`.

Alat konsultasi menjalankan agen OpenClaw reguler di balik layar dengan konteks transkrip rapat terbaru dan mengembalikan jawaban lisan singkat ke sesi suara realtime. Model suara kemudian dapat mengucapkan jawaban itu kembali ke dalam rapat.
Alat ini menggunakan alat konsultasi realtime bersama yang sama seperti Voice Call.

`realtime.toolPolicy` mengontrol run konsultasi:

- `safe-read-only`: mengekspos alat konsultasi dan membatasi agen reguler ke
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan
  `memory_get`.
- `owner`: mengekspos alat konsultasi dan membiarkan agen reguler menggunakan kebijakan alat agen normal.
- `none`: jangan mengekspos alat konsultasi ke model suara realtime.

Session key konsultasi dicakup per sesi Meet, sehingga panggilan konsultasi lanjutan
dapat menggunakan ulang konteks konsultasi sebelumnya selama rapat yang sama.

Untuk memaksa pemeriksaan kesiapan lisan setelah Chrome sepenuhnya bergabung ke panggilan:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Untuk smoke penuh join-and-speak:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Daftar periksa live test

Gunakan urutan ini sebelum menyerahkan rapat ke agen tanpa pengawasan:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Status `chrome-node` yang diharapkan:

- `googlemeet setup` semuanya hijau.
- `googlemeet setup` mencakup `chrome-node-connected` saat `chrome-node` adalah
  transport default atau sebuah node dipin.
- `nodes status` menunjukkan node yang dipilih terhubung.
- Node yang dipilih mengiklankan `googlemeet.chrome` dan `browser.proxy`.
- Tab Meet bergabung ke panggilan dan `test-speech` mengembalikan kesehatan Chrome dengan
  `inCall: true`.

Untuk host Chrome jarak jauh seperti VM macOS Parallels, ini adalah
pemeriksaan aman terpendek setelah memperbarui Gateway atau VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Ini membuktikan Plugin Gateway dimuat, node VM terhubung dengan
token saat ini, dan jembatan audio Meet tersedia sebelum agen membuka tab
rapat nyata.

Untuk smoke Twilio, gunakan rapat yang mengekspos detail dial-in telepon:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Status Twilio yang diharapkan:

- `googlemeet setup` mencakup pemeriksaan `twilio-voice-call-plugin` dan
  `twilio-voice-call-credentials` yang hijau.
- `voicecall` tersedia di CLI setelah Gateway di-reload.
- Sesi yang dikembalikan memiliki `transport: "twilio"` dan `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` menutup panggilan suara yang didelegasikan.

## Pemecahan masalah

### Agen tidak dapat melihat alat Google Meet

Konfirmasi Plugin diaktifkan dalam konfigurasi Gateway dan reload Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jika Anda baru saja mengedit `plugins.entries.google-meet`, restart atau reload Gateway.
Agen yang sedang berjalan hanya melihat alat Plugin yang didaftarkan oleh proses
Gateway saat ini.

### Tidak ada node berkemampuan Google Meet yang terhubung

Di host node, jalankan:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Di host Gateway, setujui node dan verifikasi perintah:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node harus terhubung dan mencantumkan `googlemeet.chrome` plus `browser.proxy`.
Konfigurasi Gateway harus mengizinkan perintah node tersebut:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jika `googlemeet setup` gagal pada `chrome-node-connected` atau log Gateway melaporkan
`gateway token mismatch`, pasang ulang atau restart node dengan token Gateway
saat ini. Untuk Gateway LAN ini biasanya berarti:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Lalu reload layanan node dan jalankan ulang:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser terbuka tetapi agen tidak bisa bergabung

Jalankan `googlemeet test-speech` dan periksa kesehatan Chrome yang dikembalikan. Jika
melaporkan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator
dan berhenti mencoba ulang sampai tindakan browser selesai.

Tindakan manual yang umum:

- Login ke profil Chrome.
- Terima tamu dari akun host Meet.
- Berikan izin mikrofon/kamera Chrome saat prompt izin native Chrome
  muncul.
- Tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "belum login" hanya karena Meet menampilkan "Do you want people to
hear you in the meeting?" Itu adalah interstisial pilihan audio milik Meet; OpenClaw
mengklik **Use microphone** melalui otomatisasi browser saat tersedia dan tetap
menunggu status rapat yang sebenarnya. Untuk fallback browser create-only, OpenClaw
dapat mengklik **Continue without microphone** karena pembuatan URL tidak memerlukan
jalur audio realtime.

### Pembuatan rapat gagal

`googlemeet create` pertama-tama menggunakan endpoint Google Meet API `spaces.create`
saat kredensial OAuth dikonfigurasi. Tanpa kredensial OAuth perintah ini fallback
ke browser node Chrome yang dipin. Konfirmasikan:

- Untuk pembuatan API: `oauth.clientId` dan `oauth.refreshToken` dikonfigurasi,
  atau variabel environment `OPENCLAW_GOOGLE_MEET_*` yang cocok ada.
- Untuk pembuatan API: refresh token dibuat setelah dukungan pembuatan
  ditambahkan. Token lama mungkin tidak memiliki scope `meetings.space.created`; jalankan ulang
  `openclaw googlemeet auth login --json` dan perbarui konfigurasi Plugin.
- Untuk fallback browser: `defaultTransport: "chrome-node"` dan
  `chromeNode.node` menunjuk ke node terhubung dengan `browser.proxy` dan
  `googlemeet.chrome`.
- Untuk fallback browser: profil Chrome OpenClaw pada node tersebut login
  ke Google dan dapat membuka `https://meet.google.com/new`.
- Untuk fallback browser: retry menggunakan ulang tab `https://meet.google.com/new`
  atau prompt akun Google yang sudah ada sebelum membuka tab baru. Jika agen kehabisan waktu,
  retry panggilan alat alih-alih membuka tab Meet lain secara manual.
- Untuk fallback browser: jika alat mengembalikan `manualActionRequired: true`, gunakan
  `browser.nodeId`, `browser.targetId`, `browserUrl`, dan
  `manualActionMessage` yang dikembalikan untuk memandu operator. Jangan retry dalam loop sampai
  tindakan tersebut selesai.
- Untuk fallback browser: jika Meet menampilkan "Do you want people to hear you in the
  meeting?", biarkan tab tetap terbuka. OpenClaw seharusnya mengklik **Use microphone** atau, untuk
  fallback create-only, **Continue without microphone** melalui browser
  automation dan terus menunggu URL Meet yang dihasilkan. Jika tidak bisa, error
  seharusnya menyebut `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

Periksa jalur realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "realtime"` untuk mendengar/berbicara kembali. `mode: "transcribe"` memang sengaja
tidak memulai jembatan suara realtime duplex.

Verifikasi juga:

- Key penyedia realtime tersedia pada host Gateway, seperti
  `OPENAI_API_KEY` atau `GEMINI_API_KEY`.
- `BlackHole 2ch` terlihat pada host Chrome.
- `rec` dan `play` ada pada host Chrome.
- Mikrofon dan speaker Meet dirutekan melalui jalur audio virtual yang digunakan
  OpenClaw.

`googlemeet doctor [session-id]` mencetak sesi, node, status in-call,
alasan tindakan manual, koneksi penyedia realtime, `realtimeReady`, aktivitas audio
input/output, timestamp audio terakhir, penghitung byte, dan URL browser.
Gunakan `googlemeet status [session-id]` saat Anda memerlukan JSON mentah. Gunakan
`googlemeet doctor --oauth` saat Anda perlu memverifikasi refresh Google Meet OAuth
tanpa mengekspos token; tambahkan `--meeting` atau `--create-space` saat Anda juga memerlukan
bukti Google Meet API.

Jika agen kehabisan waktu dan Anda dapat melihat tab Meet sudah terbuka, periksa tab
itu tanpa membuka yang lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Aksi alat yang setara adalah `recover_current_tab`. Aksi ini memfokuskan dan memeriksa
tab Meet yang sudah ada pada node Chrome yang dikonfigurasi. Aksi ini tidak membuka tab baru atau
membuat sesi baru; aksi ini melaporkan penghambat saat ini, seperti login, penerimaan,
izin, atau status pilihan audio. Perintah CLI berbicara ke Gateway yang
dikonfigurasi, sehingga Gateway harus berjalan dan node Chrome harus terhubung.

### Pemeriksaan penyiapan Twilio gagal

`twilio-voice-call-plugin` gagal saat `voice-call` tidak diizinkan atau tidak diaktifkan.
Tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, dan reload
Gateway.

`twilio-voice-call-credentials` gagal saat backend Twilio tidak memiliki account
SID, auth token, atau nomor penelepon. Atur ini pada host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Lalu restart atau reload Gateway dan jalankan:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` secara default hanya untuk kesiapan. Untuk dry-run nomor tertentu:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Tambahkan `--yes` hanya ketika Anda memang sengaja ingin melakukan panggilan
notifikasi outbound live:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat

Konfirmasi event Meet mengekspos detail dial-in telepon. Berikan nomor dial-in
dan PIN yang tepat atau urutan DTMF kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan awalan `w` atau koma di `--dtmf-sequence` jika penyedia memerlukan jeda
sebelum memasukkan PIN.

## Catatan

Media API resmi Google Meet berorientasi pada penerimaan, sehingga berbicara ke dalam panggilan Meet
tetap memerlukan jalur peserta. Plugin ini menjaga batas itu tetap terlihat:
Chrome menangani partisipasi browser dan perutean audio lokal; Twilio menangani
partisipasi dial-in telepon.

Mode realtime Chrome memerlukan salah satu dari:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw memiliki
  jembatan model realtime dan mem-pipe audio 8 kHz G.711 mu-law di antara
  perintah tersebut dan penyedia suara realtime yang dipilih.
- `chrome.audioBridgeCommand`: perintah bridge eksternal memiliki seluruh jalur
  audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya.

Untuk audio duplex yang bersih, rutekan output Meet dan mikrofon Meet melalui
perangkat virtual terpisah atau graph perangkat virtual bergaya Loopback. Satu perangkat
BlackHole bersama dapat menggemakan peserta lain kembali ke dalam panggilan.

`googlemeet speak` memicu jembatan audio realtime aktif untuk sesi Chrome.
`googlemeet leave` menghentikan jembatan itu. Untuk sesi Twilio yang didelegasikan
melalui Plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.

## Terkait

- [Plugin Voice Call](/id/plugins/voice-call)
- [Mode Talk](/id/nodes/talk)
- [Membangun Plugin](/id/plugins/building-plugins)
