---
read_when:
    - Menggunakan atau memodifikasi tool exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan tool exec, mode stdin, dan dukungan TTY
title: Tool Exec
x-i18n:
    generated_at: "2026-04-21T09:24:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Tool Exec

Jalankan perintah shell di workspace. Mendukung eksekusi foreground + background melalui `process`.
Jika `process` tidak diizinkan, `exec` berjalan sinkron dan mengabaikan `yieldMs`/`background`.
Sesi background dibatasi per agent; `process` hanya melihat sesi dari agent yang sama.

## Parameter

- `command` (wajib)
- `workdir` (default ke cwd)
- `env` (override key/value)
- `yieldMs` (default 10000): otomatis ke background setelah jeda
- `background` (bool): langsung ke background
- `timeout` (detik, default 1800): hentikan saat kedaluwarsa
- `pty` (bool): jalankan di pseudo-terminal saat tersedia (CLI khusus TTY, coding agent, terminal UI)
- `host` (`auto | sandbox | gateway | node`): tempat eksekusi
- `security` (`deny | allowlist | full`): mode enforcement untuk `gateway`/`node`
- `ask` (`off | on-miss | always`): prompt persetujuan untuk `gateway`/`node`
- `node` (string): id/nama node untuk `host=node`
- `elevated` (bool): minta mode elevated (keluar dari sandbox ke jalur host yang dikonfigurasi); `security=full` hanya dipaksa saat elevated di-resolve ke `full`

Catatan:

- `host` default ke `auto`: sandbox saat runtime sandbox aktif untuk sesi, jika tidak maka gateway.
- `auto` adalah strategi routing default, bukan wildcard. `host=node` per-panggilan diizinkan dari `auto`; `host=gateway` per-panggilan hanya diizinkan saat tidak ada runtime sandbox yang aktif.
- Tanpa config tambahan, `host=auto` tetap “langsung berfungsi”: tanpa sandbox berarti di-resolve ke `gateway`; sandbox aktif berarti tetap di sandbox.
- `elevated` keluar dari sandbox ke jalur host yang dikonfigurasi: default `gateway`, atau `node` saat `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia saat akses elevated diaktifkan untuk sesi/provider saat ini.
- Persetujuan `gateway`/`node` dikendalikan oleh `~/.openclaw/exec-approvals.json`.
- `node` memerlukan node yang sudah pairing (companion app atau host node headless).
- Jika ada beberapa node, atur `exec.node` atau `tools.exec.node` untuk memilih salah satu.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk node; wrapper lama `nodes.run` telah dihapus.
- Pada host non-Windows, exec menggunakan `SHELL` jika diatur; jika `SHELL` adalah `fish`, ia mengutamakan `bash` (atau `sh`)
  dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu fallback ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec mengutamakan penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH),
  lalu fallback ke Windows PowerShell 5.1.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan override loader (`LD_*`/`DYLD_*`) untuk
  mencegah pembajakan biner atau injeksi kode.
- OpenClaw mengatur `OPENCLAW_SHELL=exec` di environment perintah yang di-spawn (termasuk eksekusi PTY dan sandbox) agar aturan shell/profile dapat mendeteksi konteks tool exec.
- Penting: sandboxing **dimatikan secara default**. Jika sandboxing dimatikan, `host=auto` implisit
  di-resolve ke `gateway`. `host=sandbox` eksplisit tetap gagal tertutup alih-alih diam-diam
  berjalan di host gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan sintaks shell Python/Node yang umum) hanya memeriksa file di dalam
  batas `workdir` efektif. Jika path skrip di-resolve di luar `workdir`, preflight dilewati untuk
  file tersebut.
- Untuk pekerjaan jangka panjang yang dimulai sekarang, mulai sekali dan andalkan
  bangun penyelesaian otomatis saat diaktifkan dan perintah menghasilkan output atau gagal.
  Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru
  penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang seharusnya terjadi nanti atau terjadwal, gunakan Cron alih-alih
  pola sleep/delay `exec`.

## Config

- `tools.exec.notifyOnExit` (default: true): saat true, sesi exec yang dibackground-kan memasukkan system event dan meminta Heartbeat saat selesai.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): kirim satu pemberitahuan “running” saat exec dengan gate persetujuan berjalan lebih lama dari ini (0 menonaktifkan).
- `tools.exec.host` (default: `auto`; di-resolve ke `sandbox` saat runtime sandbox aktif, selain itu `gateway`)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk gateway + node jika tidak diatur)
- `tools.exec.ask` (default: `off`)
- Exec host tanpa persetujuan adalah default untuk gateway + node. Jika Anda ingin perilaku persetujuan/allowlist, perketat baik `tools.exec.*` maupun kebijakan host `~/.openclaw/exec-approvals.json`; lihat [Persetujuan exec](/id/tools/exec-approvals#no-approval-yolo-mode).
- YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa routing gateway atau node, atur `tools.exec.host` atau gunakan `/exec host=...`.
- Dalam mode `security=full` plus `ask=off`, exec host mengikuti kebijakan yang dikonfigurasi secara langsung; tidak ada lapisan prefilter obfuscation perintah heuristik tambahan atau penolakan script-preflight.
- `tools.exec.node` (default: tidak diatur)
- `tools.exec.strictInlineEval` (default: false): saat true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` selalu memerlukan persetujuan eksplisit. `allow-always` tetap dapat mempertahankan pemanggilan interpreter/skrip yang jinak, tetapi bentuk inline-eval tetap meminta prompt setiap kali.
- `tools.exec.pathPrepend`: daftar direktori untuk didahulukan ke `PATH` untuk eksekusi exec (hanya gateway + sandbox).
- `tools.exec.safeBins`: biner aman khusus stdin yang dapat berjalan tanpa entri allowlist eksplisit. Untuk detail perilaku, lihat [Safe bins](/id/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: direktori eksplisit tambahan yang dipercaya untuk pemeriksaan path `safeBins`. Entri `PATH` tidak pernah dipercaya otomatis. Default bawaan adalah `/bin` dan `/usr/bin`.
- `tools.exec.safeBinProfiles`: kebijakan argv kustom opsional per safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Contoh:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Penanganan PATH

- `host=gateway`: menggabungkan `PATH` login-shell Anda ke environment exec. Override `env.PATH`
  ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: menjalankan `sh -lc` (login shell) di dalam container, jadi `/etc/profile` dapat mereset `PATH`.
  OpenClaw mendahulukan `env.PATH` setelah profile sourcing melalui env var internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya override env yang Anda kirim dan tidak diblokir yang dikirim ke node. Override `env.PATH`
  ditolak untuk eksekusi host dan diabaikan oleh host node. Jika Anda memerlukan entri PATH tambahan pada node,
  konfigurasikan environment layanan host node (systemd/launchd) atau instal tool di lokasi standar.

Binding node per-agent (gunakan indeks daftar agent di config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes menyertakan panel kecil “Exec node binding” untuk pengaturan yang sama.

## Override sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per-sesi** untuk `host`, `security`, `ask`, dan `node`.
Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model otorisasi

`/exec` hanya dihormati untuk **pengirim yang diotorisasi** (allowlist/pairing channel ditambah `commands.useAccessGroups`).
Ini hanya memperbarui **status sesi** dan tidak menulis config. Untuk menonaktifkan exec secara keras, tolak lewat tool
policy (`tools.deny: ["exec"]` atau per-agent). Persetujuan host tetap berlaku kecuali Anda secara eksplisit mengatur
`security=full` dan `ask=off`.

## Persetujuan exec (companion app / host node)

Agent yang di-sandbox dapat memerlukan persetujuan per-permintaan sebelum `exec` berjalan di host gateway atau node.
Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk kebijakan, allowlist, dan alur UI.

Saat persetujuan diperlukan, tool exec segera mengembalikan
`status: "approval-pending"` dan approval id. Setelah disetujui (atau ditolak / timeout),
Gateway mengirim system event (`Exec finished` / `Exec denied`). Jika perintah masih
berjalan setelah `tools.exec.approvalRunningNoticeMs`, satu pemberitahuan `Exec running` dikirim.
Pada channel dengan kartu/tombol persetujuan native, agent harus mengandalkan
UI native tersebut terlebih dahulu dan hanya menyertakan perintah manual `/approve` saat
hasil tool secara eksplisit mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah
satu-satunya jalur.

## Allowlist + safe bins

Enforcement allowlist manual hanya mencocokkan **path biner yang telah di-resolve** (tanpa pencocokan basename). Saat
`security=allowlist`, perintah shell hanya diizinkan otomatis jika setiap segmen pipeline
ada di allowlist atau merupakan safe bin. Chaining (`;`, `&&`, `||`) dan redirection ditolak dalam
mode allowlist kecuali setiap segmen level atas memenuhi allowlist (termasuk safe bins).
Redirection tetap tidak didukung.
Kepercayaan tahan lama `allow-always` tidak melewati aturan itu: perintah berantai tetap memerlukan setiap
segmen level atas cocok.

`autoAllowSkills` adalah jalur kemudahan terpisah dalam persetujuan exec. Itu tidak sama dengan
entri allowlist path manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` nonaktif.

Gunakan dua kontrol tersebut untuk pekerjaan yang berbeda:

- `tools.exec.safeBins`: filter stream kecil, khusus stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya eksplisit tambahan untuk path executable safe-bin.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk safe bin kustom.
- allowlist: kepercayaan eksplisit untuk path executable.

Jangan perlakukan `safeBins` sebagai allowlist generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda memerlukannya, gunakan entri allowlist eksplisit dan pertahankan prompt persetujuan tetap aktif.
`openclaw security audit` memberi peringatan saat entri interpreter/runtime `safeBins` tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuatkan entri `safeBinProfiles` kustom yang hilang.
`openclaw security audit` dan `openclaw doctor` juga memberi peringatan saat Anda secara eksplisit menambahkan kembali bin berperilaku luas seperti `jq` ke `safeBins`.
Jika Anda secara eksplisit mengallowlist interpreter, aktifkan `tools.exec.strictInlineEval` agar bentuk eval kode inline tetap memerlukan persetujuan baru.

Untuk detail kebijakan lengkap dan contoh, lihat [Persetujuan exec](/id/tools/exec-approvals#safe-bins-stdin-only) dan [Safe bins versus allowlist](/id/tools/exec-approvals#safe-bins-versus-allowlist).

## Contoh

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling ditujukan untuk status sesuai permintaan, bukan loop menunggu. Jika bangun penyelesaian otomatis
diaktifkan, perintah dapat membangunkan sesi saat menghasilkan output atau gagal.

Kirim tombol (gaya tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (kirim CR saja):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (dibungkus bracket secara default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subtool dari `exec` untuk edit multi-file terstruktur.
Ini diaktifkan secara default untuk model OpenAI dan OpenAI Codex. Gunakan config hanya
saat Anda ingin menonaktifkannya atau membatasinya ke model tertentu:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Catatan:

- Hanya tersedia untuk model OpenAI/OpenAI Codex.
- Tool policy tetap berlaku; `allow: ["write"]` secara implisit mengizinkan `apply_patch`.
- Config berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` default ke `true`; atur ke `false` untuk menonaktifkan tool bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` default ke `true` (terbatas dalam workspace). Atur ke `false` hanya jika Anda memang ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gate persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan sandbox
- [Background Process](/id/gateway/background-process) — exec yang berjalan lama dan tool process
- [Keamanan](/id/gateway/security) — tool policy dan akses elevated
