---
read_when:
    - Anda ingin memeriksa, mengaudit, atau membatalkan catatan tugas latar belakang
    - Anda sedang mendokumentasikan perintah TaskFlow di bawah `openclaw tasks flow`
summary: Referensi CLI untuk `openclaw tasks` (ledger tugas latar belakang dan status TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T09:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

Periksa tugas latar belakang yang tahan lama dan status TaskFlow. Tanpa subperintah,
`openclaw tasks` setara dengan `openclaw tasks list`.

Lihat [Background Tasks](/id/automation/tasks) untuk model siklus hidup dan delivery.

## Penggunaan

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Opsi Root

- `--json`: keluarkan JSON.
- `--runtime <name>`: filter berdasarkan jenis: `subagent`, `acp`, `cron`, atau `cli`.
- `--status <name>`: filter berdasarkan status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, atau `lost`.

## Subperintah

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Menampilkan daftar tugas latar belakang yang dilacak, terbaru terlebih dahulu.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Menampilkan satu tugas berdasarkan ID tugas, ID run, atau kunci sesi.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Mengubah kebijakan notifikasi untuk tugas yang sedang berjalan.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Membatalkan tugas latar belakang yang sedang berjalan.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Menampilkan catatan tugas dan TaskFlow yang usang, hilang, gagal dikirim, atau tidak konsisten.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Mempratinjau atau menerapkan rekonsiliasi, penandaan cleanup, dan pruning tugas serta TaskFlow.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Memeriksa atau membatalkan status TaskFlow yang tahan lama di bawah ledger tugas.
