---
read_when:
    - Memperbarui OpenClaw
    - Ada yang rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau source), plus strategi rollback
title: Memperbarui
x-i18n:
    generated_at: "2026-04-25T13:49:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Jaga OpenClaw tetap mutakhir.

## Direkomendasikan: `openclaw update`

Cara tercepat untuk memperbarui. Perintah ini mendeteksi jenis instalasi Anda (npm atau git), mengambil versi terbaru, menjalankan `openclaw doctor`, dan me-restart gateway.

```bash
openclaw update
```

Untuk berpindah channel atau menargetkan versi tertentu:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # pratinjau tanpa menerapkan
```

`--channel beta` memprioritaskan beta, tetapi runtime fallback ke stable/latest saat
tag beta tidak ada atau lebih lama daripada rilis stable terbaru. Gunakan `--tag beta`
jika Anda menginginkan npm beta dist-tag mentah untuk pembaruan paket satu kali.

Lihat [Development channels](/id/install/development-channels) untuk semantik channel.

## Alternatif: jalankan ulang installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Tambahkan `--no-onboard` untuk melewati onboarding. Untuk instalasi source, berikan `--install-method git --no-onboard`.

## Alternatif: npm, pnpm, atau bun manual

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalasi npm global dan dependensi runtime

OpenClaw memperlakukan instalasi global yang dipaketkan sebagai hanya-baca saat runtime, bahkan ketika direktori paket global dapat ditulis oleh pengguna saat ini. Dependensi runtime plugin bawaan di-stage ke direktori runtime yang dapat ditulis alih-alih memodifikasi tree paket. Ini menjaga `openclaw update` agar tidak balapan dengan gateway atau agen lokal yang sedang berjalan yang memperbaiki dependensi plugin selama instalasi yang sama.

Beberapa penyiapan npm Linux menginstal paket global di bawah direktori milik root seperti `/usr/lib/node_modules/openclaw`. OpenClaw mendukung tata letak itu melalui jalur staging eksternal yang sama.

Untuk unit systemd yang diperkeras, tetapkan direktori stage yang dapat ditulis yang disertakan dalam `ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jika `OPENCLAW_PLUGIN_STAGE_DIR` tidak ditetapkan, OpenClaw menggunakan `$STATE_DIRECTORY` saat
systemd menyediakannya, lalu fallback ke `~/.openclaw/plugin-runtime-deps`.

### Dependensi runtime plugin bawaan

Instalasi paket menyimpan dependensi runtime plugin bawaan di luar tree paket yang hanya-baca. Saat startup dan selama `openclaw doctor --fix`, OpenClaw memperbaiki dependensi runtime hanya untuk plugin bawaan yang aktif dalam konfigurasi, aktif melalui konfigurasi channel lama, atau diaktifkan oleh default manifest bawaannya.

Penonaktifan eksplisit menang. Plugin atau channel yang dinonaktifkan tidak akan diperbaiki
dependensi runtime-nya hanya karena ada di dalam paket. Plugin eksternal dan jalur pemuatan kustom tetap menggunakan `openclaw plugins install` atau
`openclaw plugins update`.

## Auto-updater

Auto-updater nonaktif secara default. Aktifkan di `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | Perilaku                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik sepanjang `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: per jam) dan langsung menerapkan.                           |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                           |

Gateway juga mencatat petunjuk pembaruan saat startup (nonaktifkan dengan `update.checkOnStart: false`).

## Setelah memperbarui

<Steps>

### Jalankan doctor

```bash
openclaw doctor
```

Memigrasikan konfigurasi, mengaudit kebijakan DM, dan memeriksa kesehatan gateway. Detail: [Doctor](/id/gateway/doctor)

### Restart gateway

```bash
openclaw gateway restart
```

### Verifikasi

```bash
openclaw health
```

</Steps>

## Rollback

### Pin versi (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Tip: `npm view openclaw version` menampilkan versi yang saat ini dipublikasikan.

### Pin commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Untuk kembali ke latest: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca output-nya dengan saksama.
- Untuk `openclaw update --channel dev` pada source checkout, updater otomatis mem-bootstrap `pnpm` bila diperlukan. Jika Anda melihat error bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) lalu jalankan ulang pembaruan.
- Periksa: [Troubleshooting](/id/gateway/troubleshooting)
- Tanya di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Ringkasan instalasi](/id/install) — semua metode instalasi
- [Doctor](/id/gateway/doctor) — pemeriksaan kesehatan setelah pembaruan
- [Migrating](/id/install/migrating) — panduan migrasi versi mayor
