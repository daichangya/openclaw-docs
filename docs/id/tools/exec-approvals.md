---
read_when:
    - Mengonfigurasi persetujuan exec atau allowlist
    - Menerapkan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt pelarian sandbox dan implikasinya
summary: Persetujuan exec, allowlist, dan prompt pelarian sandbox
title: Persetujuan Exec
x-i18n:
    generated_at: "2026-04-10T09:13:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4a2e2f1f3c13a1d1926c9de0720513ea8a74d1ca571dbe74b188d8c560c14c
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Persetujuan exec

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk mengizinkan agen yang disandbox menjalankan
perintah di host nyata (`gateway` atau `node`). Anggap ini seperti interlock keselamatan:
perintah diizinkan hanya jika kebijakan + allowlist + (opsional) persetujuan pengguna semuanya menyetujui.
Persetujuan exec adalah **tambahan** di atas kebijakan alat dan gating elevated (kecuali elevated disetel ke `full`, yang melewati persetujuan).
Kebijakan efektif adalah yang **lebih ketat** dari default `tools.exec.*` dan approvals; jika sebuah field approvals dihilangkan, nilai `tools.exec` yang digunakan.
Host exec juga menggunakan status approvals lokal pada mesin tersebut. Nilai host-local
`ask: "always"` di `~/.openclaw/exec-approvals.json` akan tetap memunculkan prompt meskipun
default sesi atau konfigurasi meminta `ask: "on-miss"`.
Gunakan `openclaw approvals get`, `openclaw approvals get --gateway`, atau
`openclaw approvals get --node <id|name|ip>` untuk memeriksa kebijakan yang diminta,
sumber kebijakan host, dan hasil efektif.
Untuk mesin lokal, `openclaw exec-policy show` menampilkan tampilan gabungan yang sama dan
`openclaw exec-policy set|preset` dapat menyinkronkan kebijakan yang diminta secara lokal dengan
file approvals host lokal dalam satu langkah. Ketika sebuah cakupan lokal meminta `host=node`,
`openclaw exec-policy show` melaporkan cakupan itu sebagai dikelola node saat runtime alih-alih
berpura-pura bahwa file approvals lokal adalah sumber kebenaran yang efektif.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang memerlukan prompt akan
diselesaikan oleh **ask fallback** (default: deny).

Klien persetujuan chat native juga dapat mengekspos affordance khusus channel pada
pesan persetujuan yang tertunda. Misalnya, Matrix dapat menyiapkan pintasan reaction pada
prompt persetujuan (`✅` izinkan sekali, `❌` tolak, dan `♾️` izinkan selalu bila tersedia)
sambil tetap menyisakan perintah `/approve ...` dalam pesan sebagai fallback.

## Tempat ini berlaku

Persetujuan exec diterapkan secara lokal pada host eksekusi:

- **host gateway** → proses `openclaw` pada mesin gateway
- **host node** → runner node (aplikasi pendamping macOS atau host node headless)

Catatan model kepercayaan:

- Pemanggil yang diautentikasi Gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kemampuan operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi yang tidak disengaja, tetapi bukan batas autentikasi per pengguna.
- Proses host-node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv yang tepat, pengikatan env
  bila ada, dan path executable yang dipin bila berlaku.
- Untuk skrip shell dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat
  satu operand file lokal konkret. Jika file yang diikat itu berubah setelah persetujuan tetapi sebelum eksekusi,
  proses ditolak alih-alih mengeksekusi konten yang berubah.
- Pengikatan file ini sengaja bersifat best-effort, bukan model semantik lengkap dari setiap
  jalur loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu
  file lokal konkret untuk diikat, ia menolak membuat proses yang didukung persetujuan alih-alih berpura-pura cakupannya penuh.

Pemisahan macOS:

- **layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **aplikasi macOS** menegakkan persetujuan + mengeksekusi perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Approvals disimpan dalam file JSON lokal pada host eksekusi:

`~/.openclaw/exec-approvals.json`

Contoh skema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Mode "YOLO" tanpa persetujuan

Jika Anda ingin host exec berjalan tanpa prompt persetujuan, Anda harus membuka **kedua** lapisan kebijakan:

- kebijakan exec yang diminta dalam konfigurasi OpenClaw (`tools.exec.*`)
- kebijakan approvals lokal host di `~/.openclaw/exec-approvals.json`

Sekarang ini adalah perilaku host default kecuali Anda memperketatnya secara eksplisit:

- `tools.exec.security`: `full` pada `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Perbedaan penting:

- `tools.exec.host=auto` memilih tempat exec berjalan: sandbox bila tersedia, jika tidak gateway.
- YOLO memilih bagaimana host exec disetujui: `security=full` plus `ask=off`.
- Dalam mode YOLO, OpenClaw tidak menambahkan gerbang persetujuan pengaburan perintah heuristik yang terpisah di atas kebijakan host exec yang dikonfigurasi.
- `auto` tidak membuat perutean gateway menjadi override bebas dari sesi yang disandbox. Permintaan per panggilan `host=node` diizinkan dari `auto`, dan `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Jika Anda ingin default non-auto yang stabil, setel `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

Jika Anda ingin penyiapan yang lebih konservatif, kencangkan salah satu lapisan kembali ke `allowlist` / `on-miss`
atau `deny`.

Penyiapan host-gateway persisten "jangan pernah prompt":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Lalu setel file approvals host agar cocok:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Pintasan lokal untuk kebijakan host-gateway yang sama pada mesin saat ini:

```bash
openclaw exec-policy preset yolo
```

Pintasan lokal itu memperbarui keduanya:

- `tools.exec.host/security/ask` lokal
- default `~/.openclaw/exec-approvals.json` lokal

Ini sengaja hanya lokal. Jika Anda perlu mengubah approvals host-gateway atau host-node
secara remote, tetap gunakan `openclaw approvals set --gateway` atau
`openclaw approvals set --node <id|name|ip>`.

Untuk host node, terapkan file approvals yang sama pada node tersebut:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Batasan penting yang hanya berlaku lokal:

- `openclaw exec-policy` tidak menyinkronkan approvals node
- `openclaw exec-policy set --host node` ditolak
- persetujuan exec node diambil dari node saat runtime, jadi pembaruan yang menargetkan node harus menggunakan `openclaw approvals --node ...`

Pintasan sesi saja:

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan break-glass yang juga melewati persetujuan exec untuk sesi itu.

Jika file approvals host tetap lebih ketat daripada config, kebijakan host yang lebih ketat tetap menang.

## Kenop kebijakan

### Security (`exec.security`)

- **deny**: blokir semua permintaan host exec.
- **allowlist**: izinkan hanya perintah yang ada di allowlist.
- **full**: izinkan semuanya (setara dengan elevated).

### Ask (`exec.ask`)

- **off**: jangan pernah prompt.
- **on-miss**: prompt hanya ketika allowlist tidak cocok.
- **always**: prompt pada setiap perintah.
- kepercayaan tahan lama `allow-always` tidak menekan prompt ketika mode ask efektif adalah `always`

### Ask fallback (`askFallback`)

Jika sebuah prompt diperlukan tetapi tidak ada UI yang dapat dijangkau, fallback menentukan:

- **deny**: blokir.
- **allowlist**: izinkan hanya jika allowlist cocok.
- **full**: izinkan.

### Hardening eval interpreter inline (`tools.exec.strictInlineEval`)

Ketika `tools.exec.strictInlineEval=true`, OpenClaw memperlakukan bentuk eval kode inline sebagai hanya-bisa-dengan-persetujuan bahkan jika biner interpreter itu sendiri ada di allowlist.

Contoh:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Ini adalah defense-in-depth untuk loader interpreter yang tidak dipetakan dengan rapi ke satu operand file yang stabil. Dalam mode ketat:

- perintah ini tetap memerlukan persetujuan eksplisit;
- `allow-always` tidak otomatis mempertahankan entri allowlist baru untuk perintah tersebut.

## Allowlist (per agen)

Allowlist bersifat **per agen**. Jika ada beberapa agen, pindahkan agen yang sedang Anda
edit di aplikasi macOS. Pola adalah **kecocokan glob tidak peka huruf besar-kecil**.
Pola harus diselesaikan menjadi **path biner** (entri yang hanya berupa basename diabaikan).
Entri lama `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rantai shell seperti `echo ok && pwd` tetap mengharuskan setiap segmen tingkat atas memenuhi aturan allowlist.

Contoh:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri allowlist melacak:

- **id** UUID stabil yang digunakan untuk identitas UI (opsional)
- **terakhir digunakan** timestamp
- **perintah terakhir digunakan**
- **path terakhir yang diselesaikan**

## Mengizinkan otomatis CLI skill

Saat **Auto-allow skill CLIs** diaktifkan, executable yang dirujuk oleh Skills yang diketahui
diperlakukan sebagai ada di allowlist pada node (node macOS atau host node headless). Ini menggunakan
`skills.bins` melalui Gateway RPC untuk mengambil daftar bin skill. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

Catatan kepercayaan penting:

- Ini adalah **allowlist kemudahan implisit**, terpisah dari entri allowlist path manual.
- Ini dimaksudkan untuk lingkungan operator tepercaya tempat Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri allowlist path manual.

## Safe bins (khusus stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil biner **khusus stdin** (misalnya `cut`)
yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist eksplisit. Safe bins menolak
argumen file posisional dan token mirip path, sehingga hanya dapat beroperasi pada stream masuk.
Anggap ini sebagai jalur cepat sempit untuk filter stream, bukan daftar kepercayaan umum.
**Jangan** tambahkan biner interpreter atau runtime (misalnya `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ke `safeBins`.
Jika sebuah perintah dapat mengevaluasi kode, mengeksekusi subperintah, atau membaca file secara desain, pilih entri allowlist eksplisit dan biarkan prompt persetujuan tetap aktif.
Safe bins kustom harus mendefinisikan profil eksplisit di `tools.exec.safeBinProfiles.<bin>`.
Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host), yang
mencegah perilaku oracle keberadaan file dari perbedaan allow/deny.
Opsi yang berorientasi file ditolak untuk safe bins default (misalnya `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins juga menegakkan kebijakan flag per biner yang eksplisit untuk opsi yang merusak perilaku
khusus stdin (misalnya `sort -o/--output/--compress-program` dan flag rekursif grep).
Opsi panjang divalidasi fail-closed dalam mode safe-bin: flag yang tidak dikenal dan
singkatan ambigu ditolak.
Flag yang ditolak menurut profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins juga memaksa token argv diperlakukan sebagai **teks literal** pada waktu eksekusi (tanpa globbing
dan tanpa ekspansi `$VARS`) untuk segmen khusus stdin, sehingga pola seperti `*` atau `$HOME/...` tidak bisa
digunakan untuk menyelundupkan pembacaan file.
Safe bins juga harus diselesaikan dari direktori biner tepercaya (default sistem ditambah
`tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori safe-bin tepercaya bawaan sengaja dibuat minimal: `/bin`, `/usr/bin`.
Jika executable safe-bin Anda berada di path package-manager/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara eksplisit
ke `tools.exec.safeBinTrustedDirs`.
Rantai shell dan redirection tidak otomatis diizinkan dalam mode allowlist.

Rantai shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas memenuhi allowlist
(termasuk safe bins atau skill auto-allow). Redirection tetap tidak didukung dalam mode allowlist.
Substitusi perintah (`$()` / backtick) ditolak selama parsing allowlist, termasuk di dalam
tanda kutip ganda; gunakan tanda kutip tunggal jika Anda membutuhkan teks literal `$()`.
Pada approvals aplikasi pendamping macOS, teks shell mentah yang berisi sintaks kontrol atau ekspansi shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai allowlist miss kecuali
biner shell itu sendiri ada di allowlist.
Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env dalam cakupan permintaan dikurangi menjadi
allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Untuk keputusan allow-always dalam mode allowlist, wrapper dispatch yang diketahui
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable bagian dalam alih-alih
path wrapper. Shell multiplexer (`busybox`, `toybox`) juga di-unwrapped untuk applet shell (`sh`, `ash`,
dll.) sehingga executable bagian dalam disimpan alih-alih biner multiplexer. Jika sebuah wrapper atau
multiplexer tidak dapat di-unwrapped dengan aman, tidak ada entri allowlist yang disimpan secara otomatis.
Jika Anda memasukkan interpreter seperti `python3` atau `node` ke allowlist, sebaiknya gunakan `tools.exec.strictInlineEval=true` agar eval inline tetap memerlukan persetujuan eksplisit. Dalam mode ketat, `allow-always` tetap dapat menyimpan pemanggilan interpreter/skrip yang aman, tetapi carrier inline-eval tidak disimpan secara otomatis.

Safe bins bawaan:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak termasuk dalam daftar bawaan. Jika Anda memilih untuk mengaktifkannya, pertahankan entri allowlist eksplisit untuk
alur kerja non-stdin keduanya.
Untuk `grep` dalam mode safe-bin, berikan pola dengan `-e`/`--regexp`; bentuk pola posisional
ditolak agar operand file tidak bisa diselundupkan sebagai posisional yang ambigu.

### Safe bins versus allowlist

| Topik | `tools.exec.safeBins` | Allowlist (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Tujuan | Mengizinkan otomatis filter stdin sempit | Secara eksplisit mempercayai executable tertentu |
| Jenis kecocokan | Nama executable + kebijakan argv safe-bin | Pola glob path executable yang diselesaikan |
| Cakupan argumen | Dibatasi oleh profil safe-bin dan aturan token literal | Hanya kecocokan path; argumen selain itu menjadi tanggung jawab Anda |
| Contoh umum | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline | Alat apa pun dengan perilaku atau efek samping yang lebih luas |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agent `agents.list[].tools.exec.safeBinProfiles`). Kunci profil per-agent menimpa kunci global.
- entri allowlist berada di `~/.openclaw/exec-approvals.json` lokal host di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memberi peringatan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuatkan entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Bin interpreter/runtime tidak dibuatkan otomatis.

Contoh profil kustom:
__OC_I18N_900005__
Jika Anda secara eksplisit memilih `jq` ke dalam `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin
sehingga `jq -n env` tidak dapat membuang environment proses host tanpa path allowlist eksplisit
atau prompt persetujuan.

## Pengeditan Control UI

Gunakan kartu **Control UI → Nodes → Exec approvals** untuk mengedit default, override
per-agent, dan allowlist. Pilih cakupan (Defaults atau agen), sesuaikan kebijakan,
tambah/hapus pola allowlist, lalu **Save**. UI menampilkan metadata **terakhir digunakan**
per pola sehingga Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (approvals lokal) atau **Node**. Node
harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host node headless).
Jika sebuah node belum mengiklankan exec approvals, edit
`~/.openclaw/exec-approvals.json` lokalnya secara langsung.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node (lihat [Approvals CLI](/cli/approvals)).

## Alur persetujuan

Ketika sebuah prompt diperlukan, gateway menyiarkan `exec.approval.requested` ke klien operator.
Control UI dan aplikasi macOS menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan` kanonis. Gateway menggunakan
rencana itu sebagai konteks perintah/cwd/sesi yang otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Itu penting untuk latensi persetujuan asinkron:

- jalur exec node menyiapkan satu rencana kanonis di awal
- catatan persetujuan menyimpan rencana itu dan metadata pengikatannya
- setelah disetujui, pemanggilan `system.run` akhir yang diteruskan menggunakan kembali rencana yang tersimpan
  alih-alih mempercayai edit pemanggil yang dilakukan belakangan
- jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak
  proses yang diteruskan sebagai ketidakcocokan persetujuan

## Perintah interpreter/runtime

Proses interpreter/runtime yang didukung persetujuan sengaja dibuat konservatif:

- Konteks argv/cwd/env yang tepat selalu diikat.
- Bentuk skrip shell langsung dan file runtime langsung diikat secara best-effort ke satu snapshot
  file lokal konkret.
- Bentuk wrapper package-manager umum yang tetap diselesaikan menjadi satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) di-unwrapped sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya skrip package, bentuk eval, rantai loader khusus runtime, atau bentuk multi-file yang ambigu),
  eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang sebenarnya tidak
  dimilikinya.
- Untuk alur kerja tersebut, pilih sandboxing, batas host terpisah, atau alur allowlist/full tepercaya
  yang eksplisit ketika operator menerima semantik runtime yang lebih luas.

Ketika persetujuan diperlukan, alat exec langsung mengembalikan ID persetujuan. Gunakan ID itu untuk
mengorelasikan peristiwa sistem berikutnya (`Exec finished` / `Exec denied`). Jika tidak ada keputusan yang datang sebelum
timeout, permintaan diperlakukan sebagai timeout persetujuan dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman followup

Setelah exec asinkron yang disetujui selesai, OpenClaw mengirim giliran `agent` followup ke sesi yang sama.

- Jika ada target pengiriman eksternal yang valid (channel dapat dikirim plus target `to`), pengiriman followup menggunakan channel itu.
- Dalam alur khusus webchat atau sesi internal tanpa target eksternal, pengiriman followup tetap khusus sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa channel eksternal yang dapat diselesaikan, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada channel eksternal yang dapat diselesaikan, pengiriman diturunkan menjadi khusus sesi alih-alih gagal.

Dialog konfirmasi mencakup:

- perintah + argumen
- cwd
- ID agen
- path executable yang diselesaikan
- metadata host + kebijakan

Tindakan:

- **Allow once** → jalankan sekarang
- **Always allow** → tambahkan ke allowlist + jalankan
- **Deny** → blokir

## Penerusan persetujuan ke channel chat

Anda dapat meneruskan prompt persetujuan exec ke channel chat mana pun (termasuk channel plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Config:
__OC_I18N_900006__
Balas di chat:
__OC_I18N_900007__
Perintah `/approve` menangani persetujuan exec dan persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah ini otomatis memeriksa persetujuan plugin sebagai gantinya.

### Penerusan persetujuan plugin

Penerusan persetujuan plugin menggunakan pipeline pengiriman yang sama dengan persetujuan exec tetapi memiliki
config independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900008__
Bentuk config identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Channel yang mendukung balasan interaktif bersama menampilkan tombol persetujuan yang sama untuk persetujuan exec maupun
plugin. Channel tanpa UI interaktif bersama akan fallback ke teks biasa dengan instruksi `/approve`.

### Persetujuan chat yang sama di channel mana pun

Ketika permintaan persetujuan exec atau plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama
sekarang dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk channel seperti Slack, Matrix, dan
Microsoft Teams selain alur Web UI dan terminal UI yang sudah ada.

Jalur perintah teks bersama ini menggunakan model autentikasi channel normal untuk percakapan tersebut. Jika chat
asal sudah dapat mengirim perintah dan menerima balasan, permintaan persetujuan tidak lagi memerlukan adaptor pengiriman native terpisah hanya agar tetap tertunda.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi channel tersebut tetap menggunakan
daftar approver yang telah diselesaikan untuk otorisasi bahkan ketika pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi pada kegagalan "approval not found". Penolakan/error
persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM approver, fanout chat asal,
dan UX persetujuan interaktif khusus channel di atas alur `/approve` chat yang sama bersama.

Ketika kartu/tombol persetujuan native tersedia, UI native tersebut menjadi jalur utama
yang dihadapi agen. Agen tidak boleh juga menggemakan perintah chat plain
`/approve` yang duplikat kecuali hasil alat menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Model generik:

- kebijakan host exec tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native secara otomatis mengaktifkan pengiriman DM-first ketika semua kondisi berikut terpenuhi:

- channel mendukung pengiriman persetujuan native
- approver dapat diselesaikan dari `execApprovals.approvers` yang eksplisit atau dari sumber fallback terdokumentasi channel tersebut
- `channels.<channel>.execApprovals.enabled` tidak disetel atau bernilai `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya
aktif ketika approver berhasil diselesaikan. Pengiriman public origin-chat tetap harus diatur secara eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan perutean DM dan fanout channel opsional di atas alur
`/approve` chat yang sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat lain yang dapat dikirim menggunakan model autentikasi channel normal
  untuk `/approve` di chat yang sama
- ketika klien persetujuan native aktif otomatis, target pengiriman native default adalah DM approver
- untuk Discord dan Telegram, hanya approver yang berhasil diselesaikan yang dapat menyetujui atau menolak
- approver Discord dapat bersifat eksplisit (`execApprovals.approvers`) atau diinferensikan dari `commands.ownerAllowFrom`
- approver Telegram dapat bersifat eksplisit (`execApprovals.approvers`) atau diinferensikan dari konfigurasi owner yang ada (`allowFrom`, ditambah direct-message `defaultTo` bila didukung)
- approver Slack dapat bersifat eksplisit (`execApprovals.approvers`) atau diinferensikan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis approval ID, sehingga ID `plugin:` dapat menyelesaikan persetujuan plugin
  tanpa lapisan fallback lokal Slack kedua
- perutean DM/channel native Matrix dan pintasan reaction menangani persetujuan exec maupun plugin;
  otorisasi plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- peminta tidak harus menjadi approver
- chat asal dapat menyetujui langsung dengan `/approve` ketika chat itu sudah mendukung perintah dan balasan
- tombol persetujuan native Discord merutekan berdasarkan jenis approval ID: ID `plugin:` langsung menuju
  persetujuan plugin, selebihnya menuju persetujuan exec
- tombol persetujuan native Telegram mengikuti fallback exec-ke-plugin terbatas yang sama seperti `/approve`
- ketika `target` native mengaktifkan pengiriman origin-chat, prompt persetujuan menyertakan teks perintah
- persetujuan exec yang tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan terkonfigurasi yang dapat menerima permintaan, prompt akan fallback ke `askFallback`

Telegram default ke DM approver (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` saat
ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram,
OpenClaw mempertahankan topik tersebut untuk prompt persetujuan dan follow-up pasca-persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900009__
Catatan keamanan:

- Mode Unix socket `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer dengan UID yang sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL pendek.

## Peristiwa sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang notifikasi berjalan)
- `Exec finished`
- `Exec denied`

Pesan-pesan ini diposting ke sesi agen setelah node melaporkan peristiwanya.
Persetujuan exec host-gateway mengirim peristiwa siklus hidup yang sama ketika perintah selesai (dan secara opsional ketika berjalan lebih lama dari ambang batas).
Exec yang digating dengan persetujuan menggunakan kembali approval ID sebagai `runId` dalam pesan-pesan ini agar mudah dikorelasikan.

## Perilaku persetujuan yang ditolak

Ketika persetujuan exec asinkron ditolak, OpenClaw mencegah agen menggunakan kembali
output dari proses sebelumnya dari perintah yang sama dalam sesi. Alasan penolakan
diteruskan dengan panduan eksplisit bahwa tidak ada output perintah yang tersedia, yang menghentikan
agen dari mengklaim ada output baru atau mengulangi perintah yang ditolak dengan
hasil lama dari proses sukses sebelumnya.

## Implikasi

- **full** sangat kuat; pilih allowlist bila memungkinkan.
- **ask** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan host exec dari **pengirim yang berwenang**. Pengirim yang tidak berwenang tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator yang berwenang dan secara desain melewati persetujuan.
  Untuk memblokir host exec sepenuhnya, setel security approvals ke `deny` atau tolak alat `exec` melalui kebijakan alat.

Terkait:

- [Exec tool](/id/tools/exec)
- [Elevated mode](/id/tools/elevated)
- [Skills](/id/tools/skills)

## Terkait

- [Exec](/id/tools/exec) — alat eksekusi perintah shell
- [Sandboxing](/id/gateway/sandboxing) — mode sandbox dan akses workspace
- [Security](/id/gateway/security) — model keamanan dan hardening
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — kapan menggunakan masing-masing
