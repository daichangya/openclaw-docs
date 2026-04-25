---
read_when:
    - Mengonfigurasi persetujuan exec atau allowlist
    - Menerapkan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt keluar dari sandbox dan implikasinya
summary: Persetujuan exec, allowlist, dan prompt keluar dari sandbox
title: Persetujuan exec
x-i18n:
    generated_at: "2026-04-25T13:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk memungkinkan agent yang disandbox menjalankan perintah di host nyata (`gateway` atau `node`). Ini adalah interlock keamanan: perintah hanya diizinkan ketika kebijakan + allowlist + (opsional) persetujuan pengguna semuanya setuju. Persetujuan exec ditumpuk **di atas** kebijakan tool dan gerbang elevated (kecuali elevated diatur ke `full`, yang melewati persetujuan).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara default `tools.exec.*` dan persetujuan;
jika field persetujuan dihilangkan, nilai `tools.exec` yang digunakan. Host exec
juga menggunakan state persetujuan lokal pada mesin tersebut — `ask: "always"` lokal host
di `~/.openclaw/exec-approvals.json` akan tetap memunculkan prompt meskipun default sesi atau config
meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — tampilkan kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.
- `openclaw exec-policy show` — tampilan gabungan mesin lokal.
- `openclaw exec-policy set|preset` — sinkronkan kebijakan yang diminta lokal dengan file persetujuan host lokal dalam satu langkah.

Saat scope lokal meminta `host=node`, `exec-policy show` melaporkan scope itu
sebagai dikelola node saat runtime alih-alih berpura-pura bahwa file persetujuan lokal adalah
sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, permintaan apa pun yang biasanya
memunculkan prompt diselesaikan oleh **ask fallback** (default: deny).

<Tip>
Klien persetujuan chat native dapat menanam affordance khusus channel pada pesan persetujuan yang tertunda. Misalnya, Matrix menanam pintasan reaction (`✅`
izinkan sekali, `❌` tolak, `♾️` izinkan selalu) sambil tetap meninggalkan
perintah `/approve ...` di dalam pesan sebagai fallback.
</Tip>

## Tempat ini berlaku

Persetujuan exec ditegakkan secara lokal pada host eksekusi:

- **host gateway** → proses `openclaw` pada mesin Gateway
- **host node** → node runner (aplikasi pendamping macOS atau host node headless)

Catatan model trust:

- Pemanggil yang diautentikasi Gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kemampuan operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi yang tidak disengaja, tetapi bukan batas auth per pengguna.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv yang tepat, pengikatan env
  bila ada, dan path executable yang dipin bila berlaku.
- Untuk script shell dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat
  satu operand file lokal konkret. Jika file yang diikat itu berubah setelah persetujuan tetapi sebelum eksekusi,
  eksekusi ditolak alih-alih mengeksekusi konten yang berubah.
- Pengikatan file ini sengaja bersifat best-effort, bukan model semantik lengkap untuk setiap
  path loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu file lokal konkret
  untuk diikat, mode ini menolak membuat eksekusi yang didukung persetujuan alih-alih berpura-pura memberikan cakupan penuh.

Pembagian macOS:

- **service host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **aplikasi macOS** menegakkan persetujuan + mengeksekusi perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Persetujuan berada dalam file JSON lokal pada host eksekusi:

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

- kebijakan exec yang diminta di config OpenClaw (`tools.exec.*`)
- kebijakan persetujuan lokal host di `~/.openclaw/exec-approvals.json`

Ini sekarang menjadi perilaku host default kecuali Anda memperketatnya secara eksplisit:

- `tools.exec.security`: `full` pada `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Perbedaan penting:

- `tools.exec.host=auto` memilih tempat exec dijalankan: sandbox jika tersedia, jika tidak gateway.
- YOLO memilih bagaimana host exec disetujui: `security=full` plus `ask=off`.
- Provider berbasis CLI yang mengekspos mode izin noninteraktifnya sendiri dapat mengikuti kebijakan ini.
  Claude CLI menambahkan `--permission-mode bypassPermissions` saat kebijakan exec yang diminta OpenClaw adalah
  YOLO. Override perilaku backend tersebut dengan argumen Claude eksplisit di bawah
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, misalnya
  `--permission-mode default`, `acceptEdits`, atau `bypassPermissions`.
- Dalam mode YOLO, OpenClaw tidak menambahkan gerbang persetujuan heuristik penyamaran perintah atau lapisan penolakan preflight script yang terpisah di atas kebijakan host exec yang dikonfigurasi.
- `auto` tidak membuat perutean gateway menjadi override gratis dari sesi yang disandbox. Permintaan per-panggilan `host=node` diizinkan dari `auto`, dan `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Jika Anda ingin default non-auto yang stabil, atur `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

Jika Anda ingin setup yang lebih konservatif, perketat salah satu lapisan kembali ke `allowlist` / `on-miss`
atau `deny`.

Setup host gateway persisten "jangan pernah memunculkan prompt":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Lalu atur file persetujuan host agar sesuai:

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

Pintasan lokal untuk kebijakan host gateway yang sama pada mesin saat ini:

```bash
openclaw exec-policy preset yolo
```

Pintasan lokal itu memperbarui keduanya:

- `tools.exec.host/security/ask` lokal
- default `~/.openclaw/exec-approvals.json` lokal

Ini sengaja hanya lokal. Jika Anda perlu mengubah persetujuan host gateway atau host node
secara jarak jauh, lanjutkan menggunakan `openclaw approvals set --gateway` atau
`openclaw approvals set --node <id|name|ip>`.

Untuk host node, terapkan file persetujuan yang sama pada node tersebut:

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

Batasan penting hanya-lokal:

- `openclaw exec-policy` tidak menyinkronkan persetujuan node
- `openclaw exec-policy set --host node` ditolak
- persetujuan exec node diambil dari node saat runtime, sehingga pembaruan yang menargetkan node harus menggunakan `openclaw approvals --node ...`

Pintasan hanya-sesi:

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan break-glass yang juga melewati persetujuan exec untuk sesi tersebut.

Jika file persetujuan host tetap lebih ketat daripada config, kebijakan host yang lebih ketat tetap menang.

## Kenop kebijakan

### Keamanan (`exec.security`)

- **deny**: blokir semua permintaan host exec.
- **allowlist**: izinkan hanya perintah yang ada di allowlist.
- **full**: izinkan semuanya (setara dengan elevated).

### Ask (`exec.ask`)

- **off**: jangan pernah memunculkan prompt.
- **on-miss**: munculkan prompt hanya saat allowlist tidak cocok.
- **always**: munculkan prompt pada setiap perintah.
- trust tahan lama `allow-always` tidak menekan prompt saat mode ask efektif adalah `always`

### Ask fallback (`askFallback`)

Jika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau, fallback menentukan:

- **deny**: blokir.
- **allowlist**: izinkan hanya jika allowlist cocok.
- **full**: izinkan.

### Hardening eval interpreter inline (`tools.exec.strictInlineEval`)

Saat `tools.exec.strictInlineEval=true`, OpenClaw memperlakukan bentuk eval kode inline sebagai hanya-persetujuan meskipun biner interpreter itu sendiri ada di allowlist.

Contoh:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Ini adalah defense-in-depth untuk loader interpreter yang tidak dipetakan dengan rapi ke satu operand file yang stabil. Dalam mode strict:

- perintah-perintah ini tetap memerlukan persetujuan eksplisit;
- `allow-always` tidak otomatis mempertahankan entri allowlist baru untuk perintah-perintah tersebut.

## Allowlist (per agent)

Allowlist bersifat **per agent**. Jika ada beberapa agent, pindahlah agent yang sedang Anda
edit di aplikasi macOS. Pattern adalah pencocokan glob.
Pattern dapat berupa glob path biner yang diselesaikan atau glob nama perintah polos. Nama polos
hanya cocok dengan perintah yang dipanggil melalui PATH, sehingga `rg` dapat cocok dengan `/opt/homebrew/bin/rg`
saat perintahnya adalah `rg`, tetapi tidak `./rg` atau `/tmp/rg`. Gunakan glob path bila Anda
ingin memercayai satu lokasi biner tertentu.
Entri `agents.default` lama dimigrasikan ke `agents.main` saat dimuat.
Rantai shell seperti `echo ok && pwd` tetap mengharuskan setiap segmen tingkat atas memenuhi aturan allowlist.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri allowlist melacak:

- **id** UUID stabil yang digunakan untuk identitas UI (opsional)
- **last used** cap waktu
- **last used command**
- **last resolved path**

## Auto-allow CLI skill

Saat **Auto-allow skill CLIs** diaktifkan, executable yang dirujuk oleh skill yang dikenal
diperlakukan sebagai ada di allowlist pada node (node macOS atau host node headless). Ini menggunakan
`skills.bins` melalui Gateway RPC untuk mengambil daftar bin skill. Nonaktifkan ini jika Anda ingin allowlist manual yang ketat.

Catatan trust penting:

- Ini adalah **allowlist kemudahan implisit**, terpisah dari entri allowlist path manual.
- Ini dimaksudkan untuk lingkungan operator tepercaya tempat Gateway dan node berada dalam batas trust yang sama.
- Jika Anda memerlukan trust eksplisit yang ketat, tetap gunakan `autoAllowSkills: false` dan hanya entri allowlist path manual.

## Bin aman dan penerusan persetujuan

Untuk bin aman (jalur cepat hanya-stdin), detail pengikatan interpreter, dan cara
meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai klien
persetujuan native), lihat [Persetujuan exec — lanjutan](/id/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Pengeditan UI Kontrol

Gunakan kartu **UI Kontrol → Nodes → Exec approvals** untuk mengedit default, override
per-agent, dan allowlist. Pilih scope (Defaults atau agent), sesuaikan kebijakan,
tambah/hapus pattern allowlist, lalu **Simpan**. UI menampilkan metadata **last used**
per pattern agar daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**. Node
harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host node headless).
Jika sebuah node belum mengiklankan persetujuan exec, edit langsung file lokalnya
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node (lihat [Approvals CLI](/id/cli/approvals)).

## Alur persetujuan

Saat prompt diperlukan, gateway menyiarkan `exec.approval.requested` ke klien operator.
UI Kontrol dan aplikasi macOS menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang telah disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan` kanonis. Gateway menggunakan
rencana itu sebagai konteks perintah/cwd/sesi yang otoritatif saat meneruskan permintaan `system.run`
yang telah disetujui.

Itu penting untuk latensi persetujuan async:

- jalur exec node menyiapkan satu rencana kanonis di awal
- catatan persetujuan menyimpan rencana itu dan metadata pengikatannya
- setelah disetujui, panggilan `system.run` akhir yang diteruskan menggunakan ulang rencana yang tersimpan
  alih-alih memercayai edit pemanggil di kemudian hari
- jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak
  eksekusi yang diteruskan sebagai ketidakcocokan persetujuan

## Event sistem

Siklus hidup exec dimunculkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melampaui ambang notifikasi sedang berjalan)
- `Exec finished`
- `Exec denied`

Pesan-pesan ini diposting ke sesi agent setelah node melaporkan event tersebut.
Persetujuan exec host gateway memancarkan event siklus hidup yang sama saat perintah selesai (dan secara opsional saat berjalan lebih lama dari ambang batas).
Exec yang dijaga persetujuan menggunakan ulang id persetujuan sebagai `runId` di pesan-pesan ini agar mudah dikorelasikan.

## Perilaku saat persetujuan ditolak

Saat persetujuan exec async ditolak, OpenClaw mencegah agent menggunakan ulang
output dari eksekusi sebelumnya untuk perintah yang sama di sesi tersebut. Alasan penolakan
diteruskan dengan panduan eksplisit bahwa tidak ada output perintah yang tersedia, yang menghentikan
agent agar tidak mengklaim ada output baru atau mengulangi perintah yang ditolak dengan
hasil basi dari eksekusi sukses sebelumnya.

## Implikasi

- **full** sangat kuat; bila memungkinkan, utamakan allowlist.
- **ask** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per-agent mencegah persetujuan satu agent bocor ke agent lain.
- Persetujuan hanya berlaku untuk permintaan host exec dari **pengirim yang berwenang**. Pengirim yang tidak berwenang tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator berwenang dan memang melewati persetujuan. Untuk memblokir total host exec, atur keamanan persetujuan ke `deny` atau tolak tool `exec` melalui kebijakan tool.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan exec — lanjutan" href="/id/tools/exec-approvals-advanced" icon="gear">
    Bin aman, pengikatan interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Tool exec" href="/id/tools/exec" icon="terminal">
    Tool eksekusi perintah shell.
  </Card>
  <Card title="Mode elevated" href="/id/tools/elevated" icon="shield-exclamation">
    Jalur break-glass yang juga melewati persetujuan.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Mode sandbox dan akses workspace.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security" icon="lock">
    Model keamanan dan hardening.
  </Card>
  <Card title="Sandbox vs kebijakan tool vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan masing-masing kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku auto-allow yang didukung skill.
  </Card>
</CardGroup>
