---
read_when:
    - Menjalankan lebih dari satu Gateway pada mesin yang sama
    - Anda memerlukan konfigurasi/status/port yang terisolasi per Gateway
summary: Menjalankan beberapa Gateway OpenClaw pada satu host (isolasi, port, dan profil)
title: Beberapa gateway
x-i18n:
    generated_at: "2026-04-25T13:47:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

Sebagian besar penyiapan sebaiknya menggunakan satu Gateway karena satu Gateway dapat menangani beberapa koneksi pesan dan agen. Jika Anda memerlukan isolasi atau redundansi yang lebih kuat (misalnya, bot penyelamat), jalankan Gateway terpisah dengan profil/port yang terisolasi.

## Penyiapan terbaik yang direkomendasikan

Bagi sebagian besar pengguna, penyiapan bot penyelamat yang paling sederhana adalah:

- pertahankan bot utama pada profil default
- jalankan bot penyelamat pada `--profile rescue`
- gunakan bot Telegram yang benar-benar terpisah untuk akun penyelamat
- pertahankan bot penyelamat pada base port yang berbeda seperti `19789`

Ini menjaga bot penyelamat tetap terisolasi dari bot utama sehingga dapat men-debug atau menerapkan
perubahan konfigurasi jika bot utama down. Sisakan setidaknya 20 port di antara
base port agar port turunan browser/canvas/CDP tidak pernah bertabrakan.

## Mulai cepat bot penyelamat

Gunakan ini sebagai jalur default kecuali Anda punya alasan kuat untuk melakukan hal lain:

```bash
# Bot penyelamat (bot Telegram terpisah, profil terpisah, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jika bot utama Anda sudah berjalan, biasanya itu saja yang Anda butuhkan.

Selama `openclaw --profile rescue onboard`:

- gunakan token bot Telegram yang terpisah
- pertahankan profil `rescue`
- gunakan base port setidaknya 20 lebih tinggi daripada bot utama
- terima workspace penyelamat default kecuali Anda sudah mengelolanya sendiri

Jika onboarding sudah memasang layanan penyelamat untuk Anda, `gateway install`
terakhir tidak diperlukan.

## Mengapa ini berfungsi

Bot penyelamat tetap independen karena memiliki:

- profil/konfigurasi sendiri
- direktori status sendiri
- workspace sendiri
- base port sendiri (plus port turunan)
- token bot Telegram sendiri

Untuk sebagian besar penyiapan, gunakan bot Telegram yang benar-benar terpisah untuk profil penyelamat:

- mudah dijaga hanya untuk operator
- token bot dan identitas terpisah
- independen dari instalasi channel/aplikasi bot utama
- jalur pemulihan berbasis DM yang sederhana saat bot utama rusak

## Apa yang diubah oleh `--profile rescue onboard`

`openclaw --profile rescue onboard` menggunakan alur onboarding normal, tetapi
menulis semuanya ke profil terpisah.

Dalam praktiknya, itu berarti bot penyelamat mendapatkan:

- file konfigurasi sendiri
- direktori status sendiri
- workspace sendiri (default `~/.openclaw/workspace-rescue`)
- nama layanan terkelola sendiri

Selain itu, prompt-nya sama seperti onboarding normal.

## Penyiapan multi-Gateway umum

Tata letak bot penyelamat di atas adalah default termudah, tetapi pola isolasi yang sama
berfungsi untuk pasangan atau grup Gateway mana pun pada satu host.

Untuk penyiapan yang lebih umum, beri setiap Gateway tambahan profil bernama sendiri dan
base port sendiri:

```bash
# utama (profil default)
openclaw setup
openclaw gateway --port 18789

# gateway tambahan
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Jika Anda ingin kedua Gateway menggunakan profil bernama, itu juga bisa:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Layanan mengikuti pola yang sama:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Gunakan mulai cepat bot penyelamat saat Anda menginginkan lane operator cadangan. Gunakan
pola profil umum saat Anda menginginkan beberapa Gateway jangka panjang untuk
channel, tenant, workspace, atau peran operasional yang berbeda.

## Daftar periksa isolasi

Pertahankan hal-hal ini unik per instans Gateway:

- `OPENCLAW_CONFIG_PATH` — file konfigurasi per instans
- `OPENCLAW_STATE_DIR` — sesi, kredensial, cache per instans
- `agents.defaults.workspace` — root workspace per instans
- `gateway.port` (atau `--port`) — unik per instans
- port turunan browser/canvas/CDP

Jika ini dibagikan, Anda akan mengalami race konfigurasi dan konflik port.

## Pemetaan port (turunan)

Base port = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- port layanan kontrol browser = base + 2 (hanya loopback)
- host canvas disajikan pada server HTTP Gateway (port yang sama dengan `gateway.port`)
- port CDP profil browser dialokasikan otomatis dari `browser.controlPort + 9 .. + 108`

Jika Anda menimpa salah satu dari ini di konfigurasi atau env, Anda harus menjaganya tetap unik per instans.

## Catatan browser/CDP (jebakan umum)

- **Jangan** pin `browser.cdpUrl` ke nilai yang sama pada beberapa instans.
- Setiap instans memerlukan port kontrol browser dan rentang CDP sendiri (diturunkan dari port gateway-nya).
- Jika Anda memerlukan port CDP eksplisit, setel `browser.profiles.<name>.cdpPort` per instans.
- Chrome remote: gunakan `browser.profiles.<name>.cdpUrl` (per profil, per instans).

## Contoh env manual

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Pemeriksaan cepat

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretasi:

- `gateway status --deep` membantu menangkap layanan launchd/systemd/schtasks lama yang tertinggal dari instalasi yang lebih lama.
- Teks peringatan `gateway probe` seperti `multiple reachable gateways detected` hanya diharapkan saat Anda memang sengaja menjalankan lebih dari satu gateway terisolasi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Gateway lock](/id/gateway/gateway-lock)
- [Configuration](/id/gateway/configuration)
