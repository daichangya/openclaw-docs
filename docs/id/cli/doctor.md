---
read_when:
    - Anda mengalami masalah konektivitas/auth dan menginginkan perbaikan terpandu
    - Anda telah memperbarui dan menginginkan pemeriksaan kewarasan
summary: Referensi CLI untuk `openclaw doctor` (pemeriksaan kesehatan + perbaikan terpandu)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:43:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Pemeriksaan kesehatan + perbaikan cepat untuk gateway dan channel.

Terkait:

- Pemecahan masalah: [Troubleshooting](/id/gateway/troubleshooting)
- Audit keamanan: [Security](/id/gateway/security)

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
- `--force`: terapkan perbaikan agresif, termasuk menimpa konfigurasi layanan kustom bila diperlukan
- `--non-interactive`: jalankan tanpa prompt; hanya migrasi aman
- `--generate-gateway-token`: hasilkan dan konfigurasi token gateway
- `--deep`: pindai layanan sistem untuk instalasi gateway tambahan

Catatan:

- Prompt interaktif (seperti perbaikan keychain/OAuth) hanya berjalan ketika stdin adalah TTY dan `--non-interactive` **tidak** disetel. Proses headless (cron, Telegram, tanpa terminal) akan melewati prompt.
- Performa: proses `doctor` non-interaktif melewati pemuatan Plugin eager agar pemeriksaan kesehatan headless tetap cepat. Sesi interaktif tetap memuat Plugin sepenuhnya saat suatu pemeriksaan memerlukan kontribusinya.
- `--fix` (alias untuk `--repair`) menulis cadangan ke `~/.openclaw/openclaw.json.bak` dan menghapus key konfigurasi yang tidak dikenal, sambil mencantumkan setiap penghapusan.
- Pemeriksaan integritas status kini mendeteksi file transkrip yatim di direktori sesi dan dapat mengarsipkannya sebagai `.deleted.<timestamp>` untuk merebut kembali ruang dengan aman.
- Doctor juga memindai `~/.openclaw/cron/jobs.json` (atau `cron.store`) untuk bentuk pekerjaan Cron lama dan dapat menulis ulangnya di tempat sebelum penjadwal harus menormalisasinya secara otomatis saat runtime.
- Doctor memperbaiki dependensi runtime Plugin bawaan yang hilang tanpa menulis ke instalasi global terkemas. Untuk instalasi npm milik root atau unit systemd yang diperkeras, setel `OPENCLAW_PLUGIN_STAGE_DIR` ke direktori yang dapat ditulisi seperti `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor secara otomatis memigrasikan konfigurasi Talk datar lama (`talk.voiceId`, `talk.modelId`, dan sejenisnya) ke `talk.provider` + `talk.providers.<provider>`.
- Proses berulang `doctor --fix` tidak lagi melaporkan/menerapkan normalisasi Talk ketika satu-satunya perbedaan hanyalah urutan key objek.
- Doctor menyertakan pemeriksaan kesiapan pencarian memori dan dapat merekomendasikan `openclaw configure --section model` ketika kredensial embedding tidak ada.
- Jika mode sandbox diaktifkan tetapi Docker tidak tersedia, doctor melaporkan peringatan berdampak tinggi dengan remediasi (`install Docker` atau `openclaw config set agents.defaults.sandbox.mode off`).
- Jika `gateway.auth.token`/`gateway.auth.password` dikelola SecretRef dan tidak tersedia di jalur perintah saat ini, doctor melaporkan peringatan hanya-baca dan tidak menulis kredensial fallback plaintext.
- Jika pemeriksaan SecretRef channel gagal dalam jalur perbaikan, doctor tetap melanjutkan dan melaporkan peringatan alih-alih keluar lebih awal.
- Auto-resolution username Telegram `allowFrom` (`doctor --fix`) memerlukan token Telegram yang dapat di-resolve di jalur perintah saat ini. Jika pemeriksaan token tidak tersedia, doctor melaporkan peringatan dan melewati auto-resolution untuk proses tersebut.

## macOS: override env `launchctl`

Jika sebelumnya Anda menjalankan `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (atau `...PASSWORD`), nilai tersebut menimpa file konfigurasi Anda dan dapat menyebabkan error “unauthorized” yang persisten.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Terkait

- [Referensi CLI](/id/cli)
- [Gateway doctor](/id/gateway/doctor)
