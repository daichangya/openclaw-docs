---
read_when:
    - Men-debug autentikasi model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, kunci API, penggunaan ulang Claude CLI, dan token penyiapan Anthropic'
title: Autentikasi
x-i18n:
    generated_at: "2026-04-23T14:55:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# Autentikasi (Penyedia Model)

<Note>
Halaman ini membahas autentikasi **penyedia model** (kunci API, OAuth, penggunaan ulang Claude CLI, dan token penyiapan Anthropic). Untuk autentikasi **koneksi Gateway** (token, kata sandi, trusted-proxy), lihat [Konfigurasi](/id/gateway/configuration) dan [Autentikasi Trusted Proxy](/id/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan kunci API untuk penyedia model. Untuk host Gateway yang selalu aktif, kunci API biasanya merupakan opsi yang paling mudah diprediksi. Alur langganan/OAuth juga didukung saat sesuai dengan model akun penyedia Anda.

Lihat [/concepts/oauth](/id/concepts/oauth) untuk alur OAuth lengkap dan tata letak penyimpanan.
Untuk autentikasi berbasis SecretRef (`env`/`file`/`exec` providers), lihat [Manajemen Rahasia](/id/gateway/secrets).
Untuk aturan kelayakan kredensial/kode alasan yang digunakan oleh `models status --probe`, lihat
[Semantik Kredensial Auth](/id/auth-credential-semantics).

## Penyiapan yang direkomendasikan (kunci API, penyedia apa pun)

Jika Anda menjalankan Gateway jangka panjang, mulai dengan kunci API untuk penyedia yang Anda pilih.
Khusus untuk Anthropic, autentikasi kunci API tetap merupakan penyiapan server yang paling mudah diprediksi, tetapi OpenClaw juga mendukung penggunaan ulang login Claude CLI lokal.

1. Buat kunci API di konsol penyedia Anda.
2. Letakkan kunci tersebut di **host Gateway** (mesin yang menjalankan `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jika Gateway berjalan di bawah systemd/launchd, sebaiknya letakkan kunci di
   `~/.openclaw/.env` agar daemon dapat membacanya:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Lalu mulai ulang daemon (atau mulai ulang proses Gateway Anda) dan periksa kembali:

```bash
openclaw models status
openclaw doctor
```

Jika Anda lebih memilih untuk tidak mengelola variabel env sendiri, onboarding dapat menyimpan
kunci API untuk digunakan daemon: `openclaw onboard`.

Lihat [Bantuan](/id/help) untuk detail tentang pewarisan env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: kompatibilitas Claude CLI dan token

Autentikasi token penyiapan Anthropic masih tersedia di OpenClaw sebagai jalur token yang didukung. Staf Anthropic sejak itu memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai penggunaan yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Saat penggunaan ulang Claude CLI tersedia di host, itu kini menjadi jalur yang diutamakan.

Untuk host Gateway jangka panjang, kunci API Anthropic tetap merupakan penyiapan yang paling mudah diprediksi. Jika Anda ingin menggunakan ulang login Claude yang sudah ada di host yang sama, gunakan jalur Anthropic Claude CLI di onboarding/configure.

Penyiapan host yang direkomendasikan untuk penggunaan ulang Claude CLI:

```bash
# Jalankan di host Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Ini adalah penyiapan dua langkah:

1. Login-kan Claude Code itu sendiri ke Anthropic di host Gateway.
2. Beri tahu OpenClaw untuk mengalihkan pemilihan model Anthropic ke backend `claude-cli`
   lokal dan menyimpan profil auth OpenClaw yang sesuai.

Jika `claude` tidak ada di `PATH`, instal Claude Code terlebih dahulu atau atur
`agents.defaults.cliBackends.claude-cli.command` ke path biner yang sebenarnya.

Entri token manual (penyedia apa pun; menulis `auth-profiles.json` + memperbarui config):

```bash
openclaw models auth paste-token --provider openrouter
```

Referensi profil auth juga didukung untuk kredensial statis:

- Kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- Kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- Profil mode OAuth tidak mendukung kredensial SecretRef; jika `auth.profiles.<id>.mode` diatur ke `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut akan ditolak.

Pemeriksaan yang ramah otomasi (keluar dengan `1` saat kedaluwarsa/tidak ada, `2` saat akan kedaluwarsa):

```bash
openclaw models status --check
```

Probe auth langsung:

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
- Jika `auth.order.<provider>` yang eksplisit menghilangkan profil tersimpan, probe melaporkan
  `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya.
- Jika auth ada tetapi OpenClaw tidak dapat menemukan kandidat model yang bisa diprobe untuk
  penyedia tersebut, probe melaporkan `status: no_model`.
- Cooldown rate-limit dapat bersifat spesifik per model. Profil yang sedang cooldown untuk satu
  model masih dapat digunakan untuk model saudara pada penyedia yang sama.

Script operasi opsional (systemd/Termux) didokumentasikan di sini:
[Script pemantauan auth](/id/help/scripts#auth-monitoring-scripts)

## Catatan Anthropic

Backend Anthropic `claude-cli` didukung lagi.

- Staf Anthropic memberi tahu kami bahwa jalur integrasi OpenClaw ini diizinkan lagi.
- Oleh karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai penggunaan yang disetujui
  untuk proses berbasis Anthropic kecuali Anthropic menerbitkan kebijakan baru.
- Kunci API Anthropic tetap menjadi pilihan yang paling mudah diprediksi untuk host Gateway
  jangka panjang dan kontrol penagihan sisi server yang eksplisit.

## Memeriksa status auth model

```bash
openclaw models status
openclaw doctor
```

## Perilaku rotasi kunci API (Gateway)

Beberapa penyedia mendukung percobaan ulang permintaan dengan kunci alternatif saat panggilan API
mencapai batas rate-limit penyedia.

- Urutan prioritas:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (satu override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Penyedia Google juga menyertakan `GOOGLE_API_KEY` sebagai fallback tambahan.
- Daftar kunci yang sama dihapus duplikasinya sebelum digunakan.
- OpenClaw mencoba ulang dengan kunci berikutnya hanya untuk kesalahan rate-limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, atau
  `workers_ai ... quota limit exceeded`).
- Kesalahan non-rate-limit tidak dicoba ulang dengan kunci alternatif.
- Jika semua kunci gagal, kesalahan akhir dari percobaan terakhir akan dikembalikan.

## Mengontrol kredensial yang digunakan

### Per sesi (perintah chat)

Gunakan `/model <alias-or-id>@<profileId>` untuk menyematkan kredensial penyedia tertentu untuk sesi saat ini (contoh id profil: `anthropic:default`, `anthropic:work`).

Gunakan `/model` (atau `/model list`) untuk pemilih ringkas; gunakan `/model status` untuk tampilan penuh (kandidat + profil auth berikutnya, serta detail endpoint penyedia saat dikonfigurasi).

### Per agen (override CLI)

Atur override urutan profil auth yang eksplisit untuk sebuah agen (disimpan dalam `auth-state.json` agen tersebut):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan untuk menggunakan agen default yang dikonfigurasi.
Saat Anda men-debug masalah urutan, `openclaw models status --probe` menampilkan profil tersimpan
yang dihilangkan sebagai `excluded_by_auth_order` alih-alih melewatinya secara diam-diam.
Saat Anda men-debug masalah cooldown, ingat bahwa cooldown rate-limit dapat terikat
pada satu id model, bukan seluruh profil penyedia.

## Pemecahan masalah

### "Tidak ada kredensial ditemukan"

Jika profil Anthropic tidak ada, konfigurasikan kunci API Anthropic pada
**host Gateway** atau siapkan jalur token penyiapan Anthropic, lalu periksa kembali:

```bash
openclaw models status
```

### Token akan kedaluwarsa/sudah kedaluwarsa

Jalankan `openclaw models status` untuk mengonfirmasi profil mana yang akan kedaluwarsa. Jika profil token
Anthropic tidak ada atau sudah kedaluwarsa, segarkan penyiapan tersebut melalui
token penyiapan atau migrasikan ke kunci API Anthropic.
