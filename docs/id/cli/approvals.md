---
read_when:
    - Anda ingin mengedit persetujuan exec dari CLI
    - Anda perlu mengelola allowlist di host gateway atau Node
summary: Referensi CLI untuk `openclaw approvals` dan `openclaw exec-policy`
title: persetujuan
x-i18n:
    generated_at: "2026-04-23T09:18:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Kelola persetujuan exec untuk **host lokal**, **host gateway**, atau **host Node**.
Secara default, perintah menargetkan file persetujuan lokal di disk. Gunakan `--gateway` untuk menargetkan gateway, atau `--node` untuk menargetkan Node tertentu.

Alias: `openclaw exec-approvals`

Terkait:

- Persetujuan exec: [Persetujuan exec](/id/tools/exec-approvals)
- Nodes: [Nodes](/id/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` adalah perintah praktis lokal untuk menjaga agar config `tools.exec.*` yang diminta dan file persetujuan host lokal tetap selaras dalam satu langkah.

Gunakan saat Anda ingin:

- memeriksa kebijakan yang diminta secara lokal, file persetujuan host, dan penggabungan efektifnya
- menerapkan preset lokal seperti YOLO atau deny-all
- menyinkronkan `tools.exec.*` lokal dan `~/.openclaw/exec-approvals.json` lokal

Contoh:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Mode output:

- tanpa `--json`: mencetak tampilan tabel yang dapat dibaca manusia
- `--json`: mencetak output terstruktur yang dapat dibaca mesin

Cakupan saat ini:

- `exec-policy` **hanya lokal**
- perintah ini memperbarui file config lokal dan file persetujuan lokal secara bersamaan
- perintah ini **tidak** mendorong kebijakan ke host gateway atau host Node
- `--host node` ditolak dalam perintah ini karena persetujuan exec Node diambil dari Node saat runtime dan harus dikelola melalui perintah persetujuan yang menargetkan Node
- `openclaw exec-policy show` menandai cakupan `host=node` sebagai dikelola Node saat runtime alih-alih menurunkan kebijakan efektif dari file persetujuan lokal

Jika Anda perlu mengedit persetujuan host remote secara langsung, tetap gunakan `openclaw approvals set --gateway`
atau `openclaw approvals set --node <id|name|ip>`.

## Perintah umum

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` sekarang menampilkan kebijakan exec efektif untuk target lokal, gateway, dan Node:

- kebijakan `tools.exec` yang diminta
- kebijakan file persetujuan host
- hasil efektif setelah aturan prioritas diterapkan

Prioritas ini disengaja:

- file persetujuan host adalah sumber kebenaran yang dapat ditegakkan
- kebijakan `tools.exec` yang diminta dapat mempersempit atau memperluas niat, tetapi hasil efektif tetap diturunkan dari aturan host
- `--node` menggabungkan file persetujuan host Node dengan kebijakan `tools.exec` gateway, karena keduanya tetap berlaku saat runtime
- jika config gateway tidak tersedia, CLI melakukan fallback ke snapshot persetujuan Node dan mencatat bahwa kebijakan runtime final tidak dapat dihitung

## Ganti persetujuan dari file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` menerima JSON5, bukan hanya JSON ketat. Gunakan `--file` atau `--stdin`, bukan keduanya.

## Contoh "jangan pernah prompt" / YOLO

Untuk host yang tidak boleh pernah berhenti pada persetujuan exec, atur default persetujuan host ke `full` + `off`:

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

Varian Node:

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

Ini hanya mengubah **file persetujuan host**. Agar kebijakan OpenClaw yang diminta tetap selaras, atur juga:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Mengapa `tools.exec.host=gateway` dalam contoh ini:

- `host=auto` tetap berarti "sandbox jika tersedia, jika tidak gateway".
- YOLO berkaitan dengan persetujuan, bukan perutean.
- Jika Anda ingin exec host meskipun sandbox dikonfigurasi, buat pilihan host eksplisit dengan `gateway` atau `/exec host=gateway`.

Ini sesuai dengan perilaku default host YOLO saat ini. Perketat jika Anda menginginkan persetujuan.

Shortcut lokal:

```bash
openclaw exec-policy preset yolo
```

Shortcut lokal tersebut memperbarui config `tools.exec.*` lokal yang diminta dan default persetujuan lokal secara bersamaan. Maksudnya setara dengan penyiapan manual dua langkah di atas, tetapi hanya untuk mesin lokal.

## Helper allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opsi umum

`get`, `set`, dan `allowlist add|remove` semuanya mendukung:

- `--node <id|name|ip>`
- `--gateway`
- opsi RPC Node bersama: `--url`, `--token`, `--timeout`, `--json`

Catatan penargetan:

- tanpa flag target berarti file persetujuan lokal di disk
- `--gateway` menargetkan file persetujuan host gateway
- `--node` menargetkan satu host Node setelah menyelesaikan id, nama, IP, atau prefiks id

`allowlist add|remove` juga mendukung:

- `--agent <id>` (default ke `*`)

## Catatan

- `--node` menggunakan resolver yang sama seperti `openclaw nodes` (id, nama, ip, atau prefiks id).
- `--agent` default ke `"*"`, yang berlaku untuk semua agen.
- Host Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host Node headless).
- File persetujuan disimpan per host di `~/.openclaw/exec-approvals.json`.
