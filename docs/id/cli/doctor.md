---
read_when:
    - Anda mengalami masalah konektivitas/auth dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan menginginkan pemeriksaan kewarasan
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: doctor
x-i18n:
    generated_at: "2026-04-23T09:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk Gateway dan saluran.

Terkait:

- Pemecahan masalah: [Pemecahan Masalah](/id/gateway/troubleshooting)
- Audit keamanan: [Keamanan](/id/gateway/security)

## Contoh

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opsi

- `--no-workspace-suggestions`: nonaktifkan saran memori/pencarian workspace
- `--yes`: terima default tanpa prompt
- `--repair`: terapkan perbaikan yang direkomendasikan tanpa prompt
- `--fix`: alias untuk `--repair`
- `--force`: terapkan perbaikan agresif, termasuk menimpa config layanan kustom bila diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman
- `--generate-gateway-token`: buat dan konfigurasikan token Gateway
- `--deep`: pindai layanan sistem untuk instalasi Gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** disetel. Eksekusi headless (Cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: eksekusi `doctor` non-interaktif melewati pemuatan Plugin eager sehingga pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat penuh Plugin saat sebuah pemeriksaan memerlukan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus kunci config yang tidak dikenal, sambil mencantumkan setiap penghapusan.
- Pemeriksaan integritas state kini mendeteksi file transkrip yatim di direktori sesi dan dapat mengarsipkannya sebagai `.deleted.<timestamp>` untuk merebut kembali ruang dengan aman.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk job Cron legacy dan dapat menulis ulangnya di tempat sebelum scheduler harus menormalkannya otomatis saat runtime.
- Doctor memperbaiki dependensi runtime Plugin bawaan yang hilang tanpa memerlukan akses tulis ke paket OpenClaw yang terinstal. Untuk instalasi npm milik root atau unit systemd yang diperkeras, setel `OPENCLAW_PLUGIN_STAGE_DIR` ke direktori yang dapat ditulisi seperti `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor otomatis memigrasikan config Talk datar legacy (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Eksekusi berulang `doctor --fix` tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan hanyalah urutan kunci objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding tidak ada.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan dengan sinyal tinggi beserta remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola oleh SecretRef dan tidak tersedia pada jalur perintah saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback plaintext.
- Jika inspeksi SecretRef saluran gagal dalam jalur perbaikan, doctor melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Auto-resolusi username Telegram `allowFrom` (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve pada jalur perintah saat ini. Jika inspeksi token tidak tersedia, doctor melaporkan peringatan dan melewati auto-resolusi untuk eksekusi tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file config Anda dan dapat menyebabkan error “unauthorized” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
