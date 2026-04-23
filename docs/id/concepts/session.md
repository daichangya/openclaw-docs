---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi scope DM untuk penyiapan multi-pengguna
summary: Cara OpenClaw mengelola sesi percakapan
title: Manajemen Sesi
x-i18n:
    generated_at: "2026-04-23T09:20:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Manajemen Sesi

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan dirutekan ke
sebuah sesi berdasarkan asalnya -- DM, chat grup, job Cron, dll.

## Cara pesan dirutekan

| Sumber          | Perilaku                  |
| --------------- | ------------------------- |
| Pesan langsung  | Sesi bersama secara default |
| Chat grup       | Terisolasi per grup       |
| Room/channel    | Terisolasi per room       |
| Job Cron        | Sesi baru per run         |
| Webhook         | Terisolasi per hook       |

## Isolasi DM

Secara default, semua DM berbagi satu sesi untuk kontinuitas. Ini cocok untuk
penyiapan satu pengguna.

<Warning>
Jika beberapa orang dapat mengirim pesan ke agent Anda, aktifkan isolasi DM. Tanpanya, semua
pengguna berbagi konteks percakapan yang sama -- pesan pribadi Alice akan
terlihat oleh Bob.
</Warning>

**Perbaikannya:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolasi berdasarkan channel + pengirim
  },
}
```

Opsi lainnya:

- `main` (default) -- semua DM berbagi satu sesi.
- `per-peer` -- isolasi berdasarkan pengirim (lintas channel).
- `per-channel-peer` -- isolasi berdasarkan channel + pengirim (disarankan).
- `per-account-channel-peer` -- isolasi berdasarkan akun + channel + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa channel, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar mereka berbagi satu sesi.
</Tip>

Verifikasi penyiapan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan ulang sampai kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 4:00 pagi waktu lokal di host
  Gateway.
- **Reset idle** (opsional) -- sesi baru setelah periode tidak aktif. Tetapkan
  `session.reset.idleMinutes`.
- **Reset manual** -- ketik `/new` atau `/reset` di chat. `/new <model>` juga
  mengganti model.

Saat reset harian dan idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.

Sesi dengan sesi CLI milik provider yang aktif tidak diputus oleh default harian implisit.
Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit saat sesi tersebut harus kedaluwarsa berdasarkan timer.

## Tempat status disimpan

Semua status sesi dimiliki oleh **Gateway**. Klien UI mengueri Gateway untuk
data sesi.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Pemeliharaan sesi

OpenClaw secara otomatis membatasi penyimpanan sesi seiring waktu. Secara default, OpenClaw berjalan
dalam mode `warn` (melaporkan apa yang akan dibersihkan). Tetapkan `session.maintenance.mode`
ke `"enforce"` untuk pembersihan otomatis:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Pratinjau dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

- `openclaw status` -- path store sesi dan aktivitas terbaru.
- `openclaw sessions --json` -- semua sesi (filter dengan `--active <minutes>`).
- `/status` di chat -- penggunaan konteks, model, dan toggle.
- `/context list` -- apa yang ada di system prompt.

## Bacaan lanjutan

- [Session Pruning](/id/concepts/session-pruning) -- memangkas hasil tool
- [Compaction](/id/concepts/compaction) -- merangkum percakapan panjang
- [Session Tools](/id/concepts/session-tool) -- tool agent untuk pekerjaan lintas sesi
- [Pendalaman Manajemen Sesi](/id/reference/session-management-compaction) --
  skema store, transkrip, kebijakan pengiriman, metadata asal, dan konfigurasi lanjutan
- [Multi-Agent](/id/concepts/multi-agent) — perutean dan isolasi sesi lintas agent
- [Background Tasks](/id/automation/tasks) — bagaimana pekerjaan yang dilepas membuat catatan tugas dengan referensi sesi
- [Perutean Channel](/id/channels/channel-routing) — bagaimana pesan masuk dirutekan ke sesi
