---
read_when:
    - Anda sedang mengelola Node yang dipasangkan (camera, screen, canvas)
    - Anda perlu menyetujui permintaan atau memanggil perintah Node
summary: Referensi CLI untuk `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:43:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Kelola Node (perangkat) yang dipasangkan dan panggil kapabilitas Node.

Terkait:

- Ringkasan Node: [Node](/id/nodes)
- Camera: [Node camera](/id/nodes/camera)
- Images: [Node image](/id/nodes/images)

Opsi umum:

- `--url`, `--token`, `--timeout`, `--json`

## Perintah umum

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` mencetak tabel pending/paired. Baris paired mencakup usia koneksi terbaru (Last Connect).
Gunakan `--connected` untuk hanya menampilkan Node yang sedang terhubung. Gunakan `--last-connected <duration>` untuk
memfilter ke Node yang terhubung dalam durasi tertentu (misalnya `24h`, `7d`).

Catatan persetujuan:

- `openclaw nodes pending` hanya memerlukan scope pairing.
- `gateway.nodes.pairing.autoApproveCidrs` dapat melewati langkah pending hanya untuk
  pairing perangkat `role: node` pertama kali yang secara eksplisit tepercaya. Ini nonaktif secara
  default dan tidak menyetujui upgrade.
- `openclaw nodes approve <requestId>` mewarisi kebutuhan scope tambahan dari
  permintaan pending:
  - permintaan tanpa perintah: hanya pairing
  - perintah Node non-exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag invoke:

- `--params <json>`: string objek JSON (default `{}`).
- `--invoke-timeout <ms>`: timeout invoke Node (default `15000`).
- `--idempotency-key <key>`: key idempotensi opsional.
- `system.run` dan `system.run.prepare` diblokir di sini; gunakan alat `exec` dengan `host=node` untuk eksekusi shell.

Untuk eksekusi shell pada Node, gunakan alat `exec` dengan `host=node` alih-alih `openclaw nodes run`.
CLI `nodes` kini berfokus pada kapabilitas: RPC langsung melalui `nodes invoke`, plus pairing, camera,
screen, location, canvas, dan notifications.

## Terkait

- [CLI reference](/id/cli)
- [Node](/id/nodes)
