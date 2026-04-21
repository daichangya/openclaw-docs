---
read_when:
    - Mengonfigurasi persetujuan exec atau allowlist
    - Mengimplementasikan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt keluar dari sandbox dan implikasinya
summary: Persetujuan exec, allowlist, dan prompt keluar dari sandbox
title: Persetujuan Exec
x-i18n:
    generated_at: "2026-04-21T09:24:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Persetujuan Exec

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk memungkinkan agen yang disandbox
menjalankan perintah di host nyata (`gateway` atau `node`). Anggap ini seperti interlock keselamatan:
perintah hanya diizinkan ketika kebijakan + allowlist + (opsional) persetujuan pengguna semuanya setuju.
Persetujuan exec adalah **tambahan** terhadap kebijakan tool dan pembatasan elevated (kecuali elevated disetel ke `full`, yang melewati persetujuan).
Kebijakan efektif adalah yang **lebih ketat** dari default `tools.exec.*` dan persetujuan; jika sebuah field persetujuan dihilangkan, nilai `tools.exec` yang digunakan.
Exec host juga menggunakan status persetujuan lokal di mesin tersebut. Nilai host-lokal
`ask: "always"` di `~/.openclaw/exec-approvals.json` akan terus memunculkan prompt meskipun
default sesi atau config meminta `ask: "on-miss"`.
Gunakan `openclaw approvals get`, `openclaw approvals get --gateway`, atau
`openclaw approvals get --node <id|name|ip>` untuk memeriksa kebijakan yang diminta,
sumber kebijakan host, dan hasil efektif.
Untuk mesin lokal, `openclaw exec-policy show` menampilkan tampilan gabungan yang sama dan
`openclaw exec-policy set|preset` dapat menyinkronkan kebijakan lokal yang diminta dengan
file persetujuan host lokal dalam satu langkah. Saat cakupan lokal meminta `host=node`,
`openclaw exec-policy show` melaporkan cakupan itu sebagai dikelola node pada runtime alih-alih
berpura-pura bahwa file persetujuan lokal adalah sumber kebenaran efektif.

Jika UI aplikasi pendamping **tidak tersedia**, request apa pun yang memerlukan prompt akan
diselesaikan oleh **fallback ask** (default: deny).

Klien persetujuan obrolan native juga dapat mengekspos affordance khusus channel pada pesan
persetujuan yang pending. Misalnya, Matrix dapat menambahkan shortcut reaksi pada
prompt persetujuan (`✅` izinkan sekali, `❌` tolak, dan `♾️` izinkan selalu bila tersedia)
sambil tetap menyisakan perintah fallback `/approve ...` di dalam pesan.

## Di mana ini berlaku

Persetujuan exec ditegakkan secara lokal pada host eksekusi:

- **host gateway** → proses `openclaw` pada mesin gateway
- **host node** → runner node (aplikasi pendamping macOS atau host node headless)

Catatan model kepercayaan:

- Pemanggil yang diautentikasi Gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas capability operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi yang tidak disengaja, tetapi bukan boundary auth per-pengguna.
- Run host-node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv persis, binding env
  bila ada, dan path executable yang dipin bila berlaku.
- Untuk skrip shell dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat
  satu operand file lokal konkret. Jika file terikat itu berubah setelah persetujuan tetapi sebelum eksekusi,
  run akan ditolak alih-alih mengeksekusi konten yang berubah.
- Pengikatan file ini sengaja best-effort, bukan model semantik lengkap untuk setiap
  jalur loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu
  file lokal konkret untuk diikat, OpenClaw menolak membuat run berbasis persetujuan alih-alih berpura-pura mencakup semuanya.

Pemisahan macOS:

- **layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **aplikasi macOS** menegakkan persetujuan + mengeksekusi perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Persetujuan berada di file JSON lokal pada host eksekusi:

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

Jika Anda ingin exec host berjalan tanpa prompt persetujuan, Anda harus membuka **kedua** lapisan kebijakan:

- kebijakan exec yang diminta dalam config OpenClaw (`tools.exec.*`)
- kebijakan persetujuan lokal host di `~/.openclaw/exec-approvals.json`

Ini sekarang menjadi perilaku host default kecuali Anda secara eksplisit memperketatnya:

- `tools.exec.security`: `full` pada `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Perbedaan penting:

- `tools.exec.host=auto` memilih di mana exec berjalan: sandbox jika tersedia, jika tidak maka gateway.
- YOLO memilih bagaimana exec host disetujui: `security=full` plus `ask=off`.
- Dalam mode YOLO, OpenClaw tidak menambahkan gerbang persetujuan obfuscation perintah heuristik terpisah atau lapisan penolakan pra-pemeriksaan skrip di atas kebijakan exec host yang dikonfigurasi.
- `auto` tidak menjadikan perutean gateway sebagai override bebas dari sesi yang disandbox. Request per-panggilan `host=node` diizinkan dari `auto`, dan `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Jika Anda menginginkan default non-auto yang stabil, set `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

Jika Anda menginginkan penyiapan yang lebih konservatif, perketat kembali salah satu lapisan ke `allowlist` / `on-miss`
atau `deny`.

Penyiapan persisten host-gateway "jangan pernah prompt":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Lalu set file persetujuan host agar cocok:

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

Shortcut lokal untuk kebijakan host-gateway yang sama di mesin saat ini:

```bash
openclaw exec-policy preset yolo
```

Shortcut lokal itu memperbarui keduanya:

- `tools.exec.host/security/ask` lokal
- default `~/.openclaw/exec-approvals.json` lokal

Ini sengaja hanya lokal. Jika Anda perlu mengubah persetujuan host-gateway atau host-node
secara jarak jauh, tetap gunakan `openclaw approvals set --gateway` atau
`openclaw approvals set --node <id|name|ip>`.

Untuk host node, terapkan file persetujuan yang sama pada node itu:

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

Batasan penting yang hanya lokal:

- `openclaw exec-policy` tidak menyinkronkan persetujuan node
- `openclaw exec-policy set --host node` ditolak
- persetujuan exec node diambil dari node pada runtime, sehingga pembaruan yang ditargetkan ke node harus menggunakan `openclaw approvals --node ...`

Shortcut khusus sesi:

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah shortcut break-glass yang juga melewati persetujuan exec untuk sesi itu.

Jika file persetujuan host tetap lebih ketat daripada config, kebijakan host yang lebih ketat tetap menang.

## Knob kebijakan

### Security (`exec.security`)

- **deny**: blokir semua request exec host.
- **allowlist**: izinkan hanya perintah yang ada dalam allowlist.
- **full**: izinkan semuanya (setara dengan elevated).

### Ask (`exec.ask`)

- **off**: jangan pernah prompt.
- **on-miss**: prompt hanya ketika allowlist tidak cocok.
- **always**: prompt pada setiap perintah.
- kepercayaan tahan lama `allow-always` tidak menekan prompt ketika mode ask efektif adalah `always`

### Ask fallback (`askFallback`)

Jika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau, fallback menentukan:

- **deny**: blokir.
- **allowlist**: izinkan hanya jika allowlist cocok.
- **full**: izinkan.

### Penguatan eval interpreter inline (`tools.exec.strictInlineEval`)

Ketika `tools.exec.strictInlineEval=true`, OpenClaw memperlakukan bentuk eval kode inline sebagai hanya-persetujuan meskipun binary interpreter itu sendiri ada dalam allowlist.

Contoh:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Ini adalah defense-in-depth untuk loader interpreter yang tidak terpetakan dengan rapi ke satu operand file stabil. Dalam mode strict:

- perintah ini tetap memerlukan persetujuan eksplisit;
- `allow-always` tidak otomatis menyimpan entri allowlist baru untuknya.

## Allowlist (per agen)

Allowlist bersifat **per agen**. Jika ada beberapa agen, pindahkan agen yang sedang
Anda edit di aplikasi macOS. Pattern adalah **kecocokan glob tidak peka huruf besar/kecil**.
Pattern harus di-resolve menjadi **path binary** (entri yang hanya berupa basename diabaikan).
Entri lama `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rangkaian shell seperti `echo ok && pwd` tetap mengharuskan setiap segmen tingkat atas memenuhi aturan allowlist.

Contoh:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri allowlist melacak:

- **id** UUID stabil yang digunakan untuk identitas UI (opsional)
- **terakhir digunakan** stempel waktu
- **perintah terakhir digunakan**
- **path terakhir di-resolve**

## Otomatis mengizinkan CLI Skills

Saat **Auto-allow skill CLIs** diaktifkan, executable yang dirujuk oleh Skills yang diketahui
dianggap ada dalam allowlist pada node (node macOS atau host node headless). Ini menggunakan
`skills.bins` melalui RPC Gateway untuk mengambil daftar bin skill. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

Catatan kepercayaan penting:

- Ini adalah **allowlist kenyamanan implisit**, terpisah dari entri allowlist path manual.
- Ini ditujukan untuk lingkungan operator tepercaya tempat Gateway dan node berada dalam boundary kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills: false` dan gunakan hanya entri allowlist path manual.

## Safe bins (hanya stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil binary **hanya stdin** (misalnya `cut`)
yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist eksplisit. Safe bins menolak
argumen file posisional dan token mirip path, sehingga hanya dapat beroperasi pada stream masuk.
Perlakukan ini sebagai jalur cepat sempit untuk filter stream, bukan daftar kepercayaan umum.
**Jangan** tambahkan binary interpreter atau runtime (misalnya `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ke `safeBins`.
Jika suatu perintah dapat mengevaluasi kode, mengeksekusi subperintah, atau membaca file secara desain, lebih baik gunakan entri allowlist eksplisit dan biarkan prompt persetujuan tetap aktif.
Safe bin kustom harus mendefinisikan profil eksplisit di `tools.exec.safeBinProfiles.<bin>`.
Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host), yang
mencegah perilaku oracle keberadaan file dari perbedaan allow/deny.
Opsi berorientasi file ditolak untuk safe bins default (misalnya `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins juga menegakkan kebijakan flag eksplisit per-binary untuk opsi yang merusak perilaku hanya-stdin
(misalnya `sort -o/--output/--compress-program` dan flag rekursif grep).
Opsi panjang divalidasi fail-closed dalam mode safe-bin: flag yang tidak dikenal dan
singkatan ambigu ditolak.
Flag yang ditolak menurut profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins juga memaksa token argv diperlakukan sebagai **teks literal** saat waktu eksekusi (tanpa globbing
dan tanpa ekspansi `$VARS`) untuk segmen yang hanya stdin, sehingga pola seperti `*` atau `$HOME/...` tidak dapat
digunakan untuk menyelundupkan pembacaan file.
Safe bins juga harus di-resolve dari direktori binary tepercaya (default sistem ditambah
`tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori safe-bin tepercaya default sengaja dibuat minimal: `/bin`, `/usr/bin`.
Jika executable safe-bin Anda berada di path package-manager/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara eksplisit
ke `tools.exec.safeBinTrustedDirs`.
Rangkaian shell dan redirection tidak diizinkan otomatis dalam mode allowlist.

Rangkaian shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas memenuhi allowlist
(termasuk safe bins atau auto-allow skill). Redirection tetap tidak didukung dalam mode allowlist.
Substitusi perintah (`$()` / backtick) ditolak selama parsing allowlist, termasuk di dalam
tanda kutip ganda; gunakan tanda kutip tunggal jika Anda memerlukan teks literal `$()`.
Pada persetujuan aplikasi pendamping macOS, teks shell mentah yang mengandung sintaks kontrol atau ekspansi shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai allowlist miss kecuali
binary shell itu sendiri ada dalam allowlist.
Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), penimpaan env bercakupan request dikurangi menjadi
allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Untuk keputusan allow-always dalam mode allowlist, wrapper dispatch yang diketahui
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable bagian dalam alih-alih path wrapper. Shell multiplexer (`busybox`, `toybox`) juga di-unwrapped untuk applet shell (`sh`, `ash`,
dll.) sehingga executable bagian dalam yang disimpan, bukan binary multiplexer. Jika wrapper atau
multiplexer tidak dapat di-unwrapped dengan aman, tidak ada entri allowlist yang disimpan secara otomatis.
Jika Anda memasukkan interpreter seperti `python3` atau `node` ke allowlist, sebaiknya gunakan `tools.exec.strictInlineEval=true` agar eval inline tetap memerlukan persetujuan eksplisit. Dalam mode strict, `allow-always` tetap dapat menyimpan pemanggilan interpreter/skrip yang aman, tetapi carrier inline-eval tidak disimpan secara otomatis.

Safe bins default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda ikut serta, pertahankan entri allowlist eksplisit untuk
alur kerja non-stdin mereka.
Untuk `grep` dalam mode safe-bin, berikan pola dengan `-e`/`--regexp`; bentuk pola posisional
ditolak agar operand file tidak dapat diselundupkan sebagai positional yang ambigu.

### Safe bins versus allowlist

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Goal             | Otomatis mengizinkan filter stdin yang sempit          | Secara eksplisit mempercayai executable tertentu             |
| Match type       | Nama executable + kebijakan argv safe-bin              | Pola glob path executable yang di-resolve                    |
| Argument scope   | Dibatasi oleh profil safe-bin dan aturan token literal | Hanya kecocokan path; argumen selain itu menjadi tanggung jawab Anda |
| Typical examples | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom                |
| Best use         | Transformasi teks berisiko rendah dalam pipeline       | Tool apa pun dengan perilaku atau efek samping yang lebih luas |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau `agents.list[].tools.exec.safeBins` per agen).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau `agents.list[].tools.exec.safeBinTrustedDirs` per agen).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau `agents.list[].tools.exec.safeBinProfiles` per agen). Kunci profil per agen menimpa kunci global.
- entri allowlist berada di `~/.openclaw/exec-approvals.json` lokal host di bawah `agents.<id>.allowlist` (atau melalui UI Control / `openclaw approvals allowlist ...`).
- `openclaw security audit` memberi peringatan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Bin interpreter/runtime tidak dibuatkan kerangkanya secara otomatis.

Contoh profil kustom:
__OC_I18N_900005__
Jika Anda secara eksplisit mengikutsertakan `jq` ke dalam `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin
sehingga `jq -n env` tidak dapat membuang environment proses host tanpa path allowlist eksplisit
atau prompt persetujuan.

## Pengeditan UI Control

Gunakan kartu **UI Control → Nodes → Exec approvals** untuk mengedit default, penimpaan
per agen, dan allowlist. Pilih cakupan (Defaults atau agen), sesuaikan kebijakan,
tambahkan/hapus pola allowlist, lalu **Save**. UI menampilkan metadata **terakhir digunakan**
per pola agar daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**. Node
harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host node headless).
Jika sebuah node belum mengiklankan exec approvals, edit
`~/.openclaw/exec-approvals.json` lokalnya secara langsung.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node (lihat [Approvals CLI](/cli/approvals)).

## Alur persetujuan

Saat prompt diperlukan, gateway menyiarkan `exec.approval.requested` ke klien operator.
UI Control dan aplikasi macOS menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
request yang disetujui ke host node.

Untuk `host=node`, request persetujuan menyertakan payload `systemRunPlan` kanonis. Gateway menggunakan
rencana itu sebagai konteks perintah/cwd/sesi otoritatif saat meneruskan request `system.run`
yang disetujui.

Ini penting untuk latensi persetujuan async:

- jalur exec node menyiapkan satu rencana kanonis di awal
- catatan persetujuan menyimpan rencana itu dan metadata pengikatannya
- setelah disetujui, panggilan `system.run` yang diteruskan menggunakan ulang rencana yang tersimpan
  alih-alih mempercayai edit pemanggil setelahnya
- jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` setelah request persetujuan dibuat, gateway menolak
  run yang diteruskan sebagai ketidakcocokan persetujuan

## Perintah interpreter/runtime

Run interpreter/runtime berbasis persetujuan sengaja konservatif:

- Konteks argv/cwd/env yang persis selalu diikat.
- Bentuk skrip shell langsung dan file runtime langsung diikat secara best-effort ke satu snapshot file lokal konkret.
- Bentuk wrapper package-manager umum yang tetap di-resolve ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) di-unwrapped sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya skrip paket, bentuk eval, rantai loader khusus runtime, atau bentuk multi-file ambigu),
  eksekusi berbasis persetujuan ditolak alih-alih mengklaim cakupan semantik yang sebenarnya
  tidak dimiliki.
- Untuk alur kerja tersebut, sebaiknya gunakan sandboxing, boundary host terpisah, atau alur allowlist/full
  tepercaya yang eksplisit ketika operator menerima semantik runtime yang lebih luas.

Saat persetujuan diperlukan, tool exec langsung mengembalikan id persetujuan. Gunakan id itu untuk
mengorelasikan event sistem setelahnya (`Exec finished` / `Exec denied`). Jika tidak ada keputusan yang datang sebelum
timeout, request diperlakukan sebagai timeout persetujuan dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman tindak lanjut

Setelah exec async yang disetujui selesai, OpenClaw mengirim giliran `agent` tindak lanjut ke sesi yang sama.

- Jika target pengiriman eksternal yang valid ada (channel yang dapat dikirim ditambah target `to`), pengiriman tindak lanjut menggunakan channel tersebut.
- Dalam alur khusus webchat atau sesi internal tanpa target eksternal, pengiriman tindak lanjut tetap hanya sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa channel eksternal yang dapat di-resolve, request gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada channel eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya sesi alih-alih gagal.

Dialog konfirmasi mencakup:

- perintah + argumen
- cwd
- id agen
- path executable yang di-resolve
- metadata host + kebijakan

Aksi:

- **Allow once** → jalankan sekarang
- **Always allow** → tambahkan ke allowlist + jalankan
- **Deny** → blokir

## Meneruskan persetujuan ke channel chat

Anda dapat meneruskan prompt persetujuan exec ke channel chat apa pun (termasuk plugin channel) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman outbound normal.

Config:
__OC_I18N_900006__
Balas di chat:
__OC_I18N_900007__
Perintah `/approve` menangani persetujuan exec maupun persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang pending, perintah ini otomatis memeriksa persetujuan plugin sebagai gantinya.

### Meneruskan persetujuan plugin

Penerusan persetujuan plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki
config independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900008__
Bentuk config-nya identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Channel yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec maupun
plugin. Channel tanpa UI interaktif bersama akan fallback ke teks biasa dengan instruksi `/approve`.

### Persetujuan chat yang sama di channel mana pun

Ketika request persetujuan exec atau plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama
sekarang dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk channel seperti Slack, Matrix, dan
Microsoft Teams selain alur UI Web dan terminal UI yang sudah ada.

Jalur perintah teks bersama ini menggunakan model auth channel normal untuk percakapan tersebut. Jika
chat asal sudah dapat mengirim perintah dan menerima balasan, request persetujuan tidak lagi memerlukan
adaptor pengiriman native terpisah hanya agar tetap pending.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi channel tersebut tetap menggunakan
daftar approver yang sudah di-resolve untuk otorisasi bahkan ketika pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi ke kegagalan "approval not found". Penolakan/error persetujuan exec yang nyata
tidak diam-diam dicoba ulang sebagai persetujuan plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM approver, fanout origin-chat,
dan UX persetujuan interaktif khusus channel di atas alur `/approve` chat yang sama bersama.

Ketika kartu/tombol persetujuan native tersedia, UI native tersebut menjadi jalur utama yang
menghadap agen. Agen tidak boleh juga menggemakan perintah chat biasa `/approve`
yang duplikat kecuali hasil tool menyatakan bahwa persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Model generik:

- kebijakan exec host tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native otomatis mengaktifkan pengiriman DM-first ketika semua hal berikut benar:

- channel mendukung pengiriman persetujuan native
- approver dapat di-resolve dari `execApprovals.approvers` eksplisit atau sumber fallback yang terdokumentasi untuk channel tersebut
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya aktif
ketika approver berhasil di-resolve. Pengiriman publik ke origin-chat tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua config persetujuan exec untuk persetujuan chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan perutean DM dan fanout channel opsional di atas alur
`/approve` chat yang sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat yang dapat dikirim serupa menggunakan model auth channel normal
  untuk `/approve` di chat yang sama
- ketika klien persetujuan native aktif otomatis, target pengiriman native default adalah DM approver
- untuk Discord dan Telegram, hanya approver yang berhasil di-resolve yang dapat menyetujui atau menolak
- approver Discord dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- approver Telegram dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari config pemilik yang ada (`allowFrom`, ditambah `defaultTo` direct-message bila didukung)
- approver Slack dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis id persetujuan, sehingga id `plugin:` dapat me-resolve persetujuan plugin
  tanpa lapisan fallback lokal Slack kedua
- perutean DM/channel native Matrix dan shortcut reaksi menangani persetujuan exec maupun plugin;
  otorisasi plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- peminta tidak perlu menjadi approver
- chat asal dapat menyetujui secara langsung dengan `/approve` ketika chat itu sudah mendukung perintah dan balasan
- tombol persetujuan Discord native merutekan berdasarkan jenis id persetujuan: id `plugin:` langsung menuju
  persetujuan plugin, semua yang lain menuju persetujuan exec
- tombol persetujuan Telegram native mengikuti fallback exec-ke-plugin terbatas yang sama seperti `/approve`
- ketika `target` native mengaktifkan pengiriman ke origin-chat, prompt persetujuan menyertakan teks perintah
- persetujuan exec yang pending kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan terkonfigurasi yang dapat menerima request, prompt akan fallback ke `askFallback`

Telegram default ke DM approver (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` ketika
ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram,
OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut setelah persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900009__
Catatan keamanan:

- Mode Unix socket `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer dengan UID yang sama.
- Challenge/response (nonce + token HMAC + hash request) + TTL singkat.

## Event sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang pemberitahuan running)
- `Exec finished`
- `Exec denied`

Pesan ini diposting ke sesi agen setelah node melaporkan event tersebut.
Persetujuan exec host-gateway memancarkan event siklus hidup yang sama ketika perintah selesai (dan opsional saat berjalan lebih lama dari ambang).
Exec yang dibatasi persetujuan menggunakan ulang id persetujuan sebagai `runId` dalam pesan ini agar mudah dikorelasikan.

## Perilaku persetujuan yang ditolak

Ketika persetujuan exec async ditolak, OpenClaw mencegah agen menggunakan ulang
output dari run sebelumnya untuk perintah yang sama dalam sesi. Alasan penolakan
diteruskan dengan panduan eksplisit bahwa tidak ada output perintah yang tersedia, yang menghentikan
agen dari mengklaim ada output baru atau mengulangi perintah yang ditolak dengan
hasil basi dari run sukses sebelumnya.

## Implikasi

- **full** sangat kuat; gunakan allowlist bila memungkinkan.
- **ask** menjaga Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk request exec host dari **pengirim yang berwenang**. Pengirim tidak berwenang tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator berwenang dan secara desain melewati persetujuan.
  Untuk memblokir keras exec host, set security persetujuan ke `deny` atau tolak tool `exec` melalui kebijakan tool.

Terkait:

- [Exec tool](/id/tools/exec)
- [Mode Elevated](/id/tools/elevated)
- [Skills](/id/tools/skills)

## Terkait

- [Exec](/id/tools/exec) — tool eksekusi perintah shell
- [Sandboxing](/id/gateway/sandboxing) — mode sandbox dan akses workspace
- [Security](/id/gateway/security) — model keamanan dan penguatan
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — kapan menggunakan masing-masing
