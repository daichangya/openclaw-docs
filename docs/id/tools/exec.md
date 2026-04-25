---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan alat exec, mode stdin, dan dukungan TTY
title: Alat exec
x-i18n:
    generated_at: "2026-04-25T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Jalankan perintah shell di workspace. Mendukung eksekusi foreground + background melalui `process`.
Jika `process` tidak diizinkan, `exec` berjalan sinkron dan mengabaikan `yieldMs`/`background`.
Sesi background dibatasi per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

<ParamField path="command" type="string" required>
Perintah shell yang akan dijalankan.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Direktori kerja untuk perintah.
</ParamField>

<ParamField path="env" type="object">
Override environment key/value yang digabungkan di atas environment turunan.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Otomatis jadikan perintah sebagai background setelah jeda ini (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Jalankan perintah di background segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Hentikan perintah setelah sejumlah detik ini.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan di pseudo-terminal jika tersedia. Gunakan untuk CLI yang hanya mendukung TTY, coding agent, dan terminal UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat eksekusi. `auto` diresolusikan ke `sandbox` saat runtime sandbox aktif dan ke `gateway` dalam kondisi lain.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode penegakan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Perilaku prompt persetujuan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Node id/nama saat `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode elevated — keluar dari sandbox ke path host yang dikonfigurasi. `security=full` dipaksakan hanya ketika elevated diresolusikan ke `full`.
</ParamField>

Catatan:

- `host` default ke `auto`: sandbox ketika runtime sandbox aktif untuk sesi tersebut, jika tidak gateway.
- `auto` adalah strategi routing default, bukan wildcard. `host=node` per pemanggilan diizinkan dari `auto`; `host=gateway` per pemanggilan hanya diizinkan ketika tidak ada runtime sandbox yang aktif.
- Tanpa konfigurasi tambahan, `host=auto` tetap “langsung berfungsi”: tanpa sandbox, ini diresolusikan ke `gateway`; dengan sandbox aktif, ini tetap di sandbox.
- `elevated` keluar dari sandbox ke path host yang dikonfigurasi: `gateway` secara default, atau `node` ketika `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia ketika akses elevated diaktifkan untuk sesi/provider saat ini.
- Persetujuan `gateway`/`node` dikendalikan oleh `~/.openclaw/exec-approvals.json`.
- `node` memerlukan node yang sudah dipasangkan (companion app atau host node headless).
- Jika tersedia beberapa node, atur `exec.node` atau `tools.exec.node` untuk memilih salah satunya.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk node; wrapper lama `nodes.run` telah dihapus.
- Pada host non-Windows, exec menggunakan `SHELL` jika disetel; jika `SHELL` adalah `fish`, exec lebih memilih `bash` (atau `sh`) dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu fallback ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec lebih memilih penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH), lalu fallback ke Windows PowerShell 5.1.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan override loader (`LD_*`/`DYLD_*`) untuk mencegah pembajakan biner atau kode yang disuntikkan.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` di environment perintah yang di-spawn (termasuk eksekusi PTY dan sandbox) sehingga aturan shell/profile dapat mendeteksi konteks exec-tool.
- Penting: sandboxing **nonaktif secara default**. Jika sandboxing nonaktif, `host=auto` implisit diresolusikan ke `gateway`. `host=sandbox` eksplisit tetap gagal-tertutup alih-alih diam-diam berjalan di host gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan sintaks shell Python/Node yang umum) hanya memeriksa file di dalam batas `workdir` efektif. Jika path skrip diresolusikan di luar `workdir`, preflight dilewati untuk file tersebut.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan wake penyelesaian otomatis ketika diaktifkan dan perintah mengeluarkan output atau gagal. Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang harus terjadi nanti atau sesuai jadwal, gunakan Cron alih-alih pola sleep/delay `exec`.

## Konfigurasi

- `tools.exec.notifyOnExit` (default: true): ketika true, sesi exec yang dibackground akan mengantrekan system event dan meminta Heartbeat saat keluar.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): keluarkan satu pemberitahuan “running” ketika exec yang dijaga persetujuan berjalan lebih lama dari ini (0 menonaktifkan).
- `tools.exec.host` (default: `auto`; diresolusikan ke `sandbox` saat runtime sandbox aktif, jika tidak `gateway`)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk gateway + node saat tidak disetel)
- `tools.exec.ask` (default: `off`)
- Host exec tanpa persetujuan adalah default untuk gateway + node. Jika Anda ingin perilaku persetujuan/allowlist, perketat `tools.exec.*` dan host `~/.openclaw/exec-approvals.json`; lihat [Persetujuan exec](/id/tools/exec-approvals#no-approval-yolo-mode).
- YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa routing gateway atau node, atur `tools.exec.host` atau gunakan `/exec host=...`.
- Dalam mode `security=full` plus `ask=off`, host exec mengikuti kebijakan yang dikonfigurasi secara langsung; tidak ada lapisan tambahan prefilter pengaburan perintah atau penolakan script-preflight.
- `tools.exec.node` (default: unset)
- `tools.exec.strictInlineEval` (default: false): ketika true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` selalu memerlukan persetujuan eksplisit. `allow-always` tetap dapat menyimpan invocation interpreter/skrip yang jinak, tetapi bentuk inline-eval tetap akan memunculkan prompt setiap kali.
- `tools.exec.pathPrepend`: daftar direktori yang akan diprepent ke `PATH` untuk eksekusi exec (hanya gateway + sandbox).
- `tools.exec.safeBins`: biner aman khusus stdin yang dapat berjalan tanpa entri allowlist eksplisit. Untuk detail perilaku, lihat [Safe bins](/id/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: direktori eksplisit tambahan yang dipercaya untuk pemeriksaan path executable `safeBins`. Entri `PATH` tidak pernah otomatis dipercaya. Default bawaan adalah `/bin` dan `/usr/bin`.
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

- `host=gateway`: menggabungkan `PATH` login-shell Anda ke environment exec. Override `env.PATH` ditolak untuk eksekusi host. Daemon sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: menjalankan `sh -lc` (login shell) di dalam container, jadi `/etc/profile` dapat mereset `PATH`.
  OpenClaw mem-prepend `env.PATH` setelah profile sourcing melalui env var internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya override env yang Anda kirim dan tidak diblokir yang dikirim ke node. Override `env.PATH` ditolak untuk eksekusi host dan diabaikan oleh host node. Jika Anda memerlukan entri PATH tambahan pada node, konfigurasi environment layanan host node (systemd/launchd) atau instal alat di lokasi standar.

Binding node per agen (gunakan indeks daftar agen di konfigurasi):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes menyertakan panel kecil “Exec node binding” untuk pengaturan yang sama.

## Override sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** untuk `host`, `security`, `ask`, dan `node`.
Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model otorisasi

`/exec` hanya dihormati untuk **pengirim yang berwenang** (allowlist channel/pairing plus `commands.useAccessGroups`).
Ini hanya memperbarui **state sesi** dan tidak menulis konfigurasi. Untuk menonaktifkan exec secara penuh, tolak melalui kebijakan alat
(`tools.deny: ["exec"]` atau per-agent). Persetujuan host tetap berlaku kecuali Anda secara eksplisit menetapkan
`security=full` dan `ask=off`.

## Persetujuan exec (companion app / host node)

Agen yang disandbox dapat memerlukan persetujuan per permintaan sebelum `exec` berjalan di host gateway atau node.
Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk kebijakan, allowlist, dan alur UI.

Ketika persetujuan diperlukan, alat exec segera mengembalikan
`status: "approval-pending"` dan id persetujuan. Setelah disetujui (atau ditolak / timeout),
Gateway mengeluarkan system event (`Exec finished` / `Exec denied`). Jika perintah masih
berjalan setelah `tools.exec.approvalRunningNoticeMs`, satu pemberitahuan `Exec running` akan dikeluarkan.
Pada channel dengan kartu/tombol persetujuan native, agen harus mengandalkan
UI native itu terlebih dahulu dan hanya menyertakan perintah `/approve` manual ketika hasil
alat secara eksplisit menyatakan persetujuan chat tidak tersedia atau jalur manual adalah satu-satunya
opsi.

## Allowlist + safe bins

Penegakan allowlist manual mencocokkan glob path biner yang telah diresolusikan dan glob nama perintah tanpa path. Nama tanpa path hanya cocok dengan perintah yang dipanggil melalui PATH, jadi `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya `rg`, tetapi tidak dengan `./rg` atau `/tmp/rg`.
Ketika `security=allowlist`, perintah shell diizinkan otomatis hanya jika setiap segmen pipeline
masuk allowlist atau merupakan safe bin. Chaining (`;`, `&&`, `||`) dan redirection
ditolak dalam mode allowlist kecuali setiap segmen tingkat atas memenuhi
allowlist (termasuk safe bins). Redirection tetap tidak didukung.
Kepercayaan `allow-always` yang tahan lama tidak melewati aturan itu: perintah berantai tetap memerlukan setiap
segmen tingkat atas cocok.

`autoAllowSkills` adalah jalur kenyamanan terpisah dalam persetujuan exec. Ini tidak sama dengan
entri allowlist path manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` nonaktif.

Gunakan dua kontrol ini untuk tugas yang berbeda:

- `tools.exec.safeBins`: filter stream kecil khusus stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tambahan eksplisit yang dipercaya untuk path executable safe-bin.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk safe bin kustom.
- allowlist: kepercayaan eksplisit untuk path executable.

Jangan perlakukan `safeBins` sebagai allowlist umum, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda membutuhkannya, gunakan entri allowlist eksplisit dan biarkan prompt persetujuan tetap aktif.
`openclaw security audit` memperingatkan ketika entri interpreter/runtime `safeBins` tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles` kustom yang hilang.
`openclaw security audit` dan `openclaw doctor` juga memperingatkan ketika Anda secara eksplisit menambahkan kembali bin berperilaku luas seperti `jq` ke `safeBins`.
Jika Anda secara eksplisit mengizinkan interpreter dalam allowlist, aktifkan `tools.exec.strictInlineEval` agar bentuk eval kode inline tetap memerlukan persetujuan baru.

Untuk detail kebijakan lengkap dan contoh, lihat [Persetujuan exec](/id/tools/exec-approvals-advanced#safe-bins-stdin-only) dan [Safe bins versus allowlist](/id/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling ditujukan untuk status sesuai permintaan, bukan loop menunggu. Jika wake penyelesaian
otomatis diaktifkan, perintah dapat membangunkan sesi ketika mengeluarkan output atau gagal.

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

Paste (diapit bracket secara default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subtool dari `exec` untuk pengeditan terstruktur multi-file.
Fitur ini aktif secara default untuk model OpenAI dan OpenAI Codex. Gunakan konfigurasi hanya
jika Anda ingin menonaktifkannya atau membatasinya ke model tertentu:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Catatan:

- Hanya tersedia untuk model OpenAI/OpenAI Codex.
- Kebijakan alat tetap berlaku; `allow: ["write"]` secara implisit mengizinkan `apply_patch`.
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` default ke `true`; setel ke `false` untuk menonaktifkan alat bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` default ke `true` (terbatas pada workspace). Setel ke `false` hanya jika Anda memang ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan sandbox
- [Background Process](/id/gateway/background-process) — exec yang berjalan lama dan alat process
- [Security](/id/gateway/security) — kebijakan alat dan akses elevated
