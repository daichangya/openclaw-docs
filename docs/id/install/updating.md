---
read_when:
    - Memperbarui OpenClaw
    - Sesuatu rusak setelah pembaruan
summary: Memperbarui OpenClaw dengan aman (instalasi global atau source), plus strategi rollback
title: Memperbarui
x-i18n:
    generated_at: "2026-04-22T04:23:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Memperbarui

Jaga OpenClaw tetap terbaru.

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

`--channel beta` mengutamakan beta, tetapi runtime melakukan fallback ke stable/latest saat
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

### Instalasi npm global milik root

Beberapa penyiapan npm Linux menginstal paket global di bawah direktori milik root seperti
`/usr/lib/node_modules/openclaw`. OpenClaw mendukung layout tersebut: paket yang terinstal
diperlakukan sebagai read-only saat runtime, dan dependensi runtime plugin bawaan
di-stage ke direktori runtime yang dapat ditulis alih-alih memodifikasi
tree paket.

Untuk unit systemd yang diperkeras, tetapkan direktori stage yang dapat ditulis dan disertakan dalam
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jika `OPENCLAW_PLUGIN_STAGE_DIR` tidak ditetapkan, OpenClaw menggunakan `$STATE_DIRECTORY` saat
systemd menyediakannya, lalu fallback ke `~/.openclaw/plugin-runtime-deps`.

## Auto-updater

Auto-updater default-nya nonaktif. Aktifkan di `~/.openclaw/openclaw.json`:

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

| Channel  | Perilaku                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Menunggu `stableDelayHours`, lalu menerapkan dengan jitter deterministik di seluruh `stableJitterHours` (rollout tersebar). |
| `beta`   | Memeriksa setiap `betaCheckIntervalHours` (default: per jam) dan langsung menerapkan.                        |
| `dev`    | Tidak ada penerapan otomatis. Gunakan `openclaw update` secara manual.                                       |

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

Untuk kembali ke versi terbaru: `git checkout main && git pull`.

## Jika Anda buntu

- Jalankan `openclaw doctor` lagi dan baca output dengan saksama.
- Untuk `openclaw update --channel dev` pada checkout source, updater otomatis melakukan bootstrap `pnpm` bila diperlukan. Jika Anda melihat error bootstrap pnpm/corepack, instal `pnpm` secara manual (atau aktifkan kembali `corepack`) lalu jalankan ulang pembaruan.
- Periksa: [Troubleshooting](/id/gateway/troubleshooting)
- Tanyakan di Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Terkait

- [Install Overview](/id/install) — semua metode instalasi
- [Doctor](/id/gateway/doctor) — pemeriksaan kesehatan setelah pembaruan
- [Migrating](/id/install/migrating) — panduan migrasi versi utama
