---
read_when:
    - Men-debug autentikasi model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, API key, penggunaan ulang Claude CLI, dan setup-token Anthropic'
title: Autentikasi
x-i18n:
    generated_at: "2026-04-07T09:13:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db0ad9eccd7e3e3ca328adaad260bc4288a8ccdbe2dc0c24d9fd049b7ab9231
    source_path: gateway/authentication.md
    workflow: 15
---

# Autentikasi (Penyedia Model)

<Note>
Halaman ini membahas autentikasi **penyedia model** (API key, OAuth, penggunaan ulang Claude CLI, dan setup-token Anthropic). Untuk autentikasi **koneksi gateway** (token, password, trusted-proxy), lihat [Configuration](/id/gateway/configuration) dan [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan API key untuk penyedia model. Untuk host gateway
yang selalu aktif, API key biasanya merupakan opsi yang paling dapat diprediksi. Alur
langganan/OAuth juga didukung ketika sesuai dengan model akun penyedia Anda.

Lihat [/concepts/oauth](/id/concepts/oauth) untuk alur OAuth lengkap dan tata letak
penyimpanan.
Untuk autentikasi berbasis SecretRef (penyedia `env`/`file`/`exec`), lihat [Secrets Management](/id/gateway/secrets).
Untuk aturan kelayakan kredensial/kode alasan yang digunakan oleh `models status --probe`, lihat
[Auth Credential Semantics](/id/auth-credential-semantics).

## Penyiapan yang direkomendasikan (API key, penyedia apa pun)

Jika Anda menjalankan gateway berumur panjang, mulai dengan API key untuk
penyedia pilihan Anda.
Khusus untuk Anthropic, autentikasi API key tetap merupakan penyiapan server yang paling dapat diprediksi,
tetapi OpenClaw juga mendukung penggunaan ulang login Claude CLI lokal.

1. Buat API key di konsol penyedia Anda.
2. Letakkan API key itu di **host gateway** (mesin yang menjalankan `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jika Gateway berjalan di bawah systemd/launchd, sebaiknya letakkan key di
   `~/.openclaw/.env` agar daemon dapat membacanya:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Lalu restart daemon (atau restart proses Gateway Anda) dan periksa kembali:

```bash
openclaw models status
openclaw doctor
```

Jika Anda lebih memilih untuk tidak mengelola env vars sendiri, onboarding dapat menyimpan
API key untuk digunakan daemon: `openclaw onboard`.

Lihat [Help](/id/help) untuk detail tentang pewarisan env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: kompatibilitas Claude CLI dan token

Autentikasi setup-token Anthropic masih tersedia di OpenClaw sebagai jalur token
yang didukung. Staf Anthropic sejak itu memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
diizinkan kembali, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
sesuatu yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Saat
penggunaan ulang Claude CLI tersedia pada host, itu sekarang menjadi jalur yang lebih disukai.

Untuk host gateway berumur panjang, API key Anthropic tetap merupakan penyiapan
yang paling dapat diprediksi. Jika Anda ingin menggunakan ulang login Claude yang sudah ada di host yang sama,
gunakan jalur Anthropic Claude CLI di onboarding/configure.

Entri token manual (penyedia apa pun; menulis `auth-profiles.json` + memperbarui config):

```bash
openclaw models auth paste-token --provider openrouter
```

Referensi profil auth juga didukung untuk kredensial statis:

- kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- profil mode OAuth tidak mendukung kredensial SecretRef; jika `auth.profiles.<id>.mode` disetel ke `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut akan ditolak.

Pemeriksaan ramah otomatisasi (exit `1` saat kedaluwarsa/tidak ada, `2` saat akan kedaluwarsa):

```bash
openclaw models status --check
```

Probe auth live:

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
- Jika `auth.order.<provider>` eksplisit menghilangkan profil yang disimpan, probe melaporkan
  `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya.
- Jika auth ada tetapi OpenClaw tidak dapat menyelesaikan kandidat model yang dapat diprobe untuk
  penyedia tersebut, probe melaporkan `status: no_model`.
- Cooldown rate limit dapat dicakup per model. Profil yang sedang cooldown untuk satu
  model masih dapat digunakan untuk model saudara pada penyedia yang sama.

Skrip ops opsional (systemd/Termux) didokumentasikan di sini:
[Auth monitoring scripts](/id/help/scripts#auth-monitoring-scripts)

## Catatan Anthropic

Backend Anthropic `claude-cli` didukung kembali.

- Staf Anthropic memberi tahu kami bahwa jalur integrasi OpenClaw ini diizinkan kembali.
- Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
  sesuatu yang disetujui untuk proses berbasis Anthropic kecuali Anthropic menerbitkan kebijakan baru.
- API key Anthropic tetap menjadi pilihan yang paling dapat diprediksi untuk host gateway
  berumur panjang dan kontrol penagihan sisi server yang eksplisit.

## Memeriksa status autentikasi model

```bash
openclaw models status
openclaw doctor
```

## Perilaku rotasi API key (gateway)

Beberapa penyedia mendukung percobaan ulang permintaan dengan key alternatif saat panggilan API
mencapai rate limit penyedia.

- Urutan prioritas:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override tunggal)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Penyedia Google juga menyertakan `GOOGLE_API_KEY` sebagai fallback tambahan.
- Daftar key yang sama dideduplikasi sebelum digunakan.
- OpenClaw mencoba ulang dengan key berikutnya hanya untuk error rate limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, atau
  `workers_ai ... quota limit exceeded`).
- Error non-rate-limit tidak dicoba ulang dengan key alternatif.
- Jika semua key gagal, error akhir dari percobaan terakhir akan dikembalikan.

## Mengontrol kredensial mana yang digunakan

### Per sesi (perintah chat)

Gunakan `/model <alias-or-id>@<profileId>` untuk menetapkan kredensial penyedia tertentu bagi sesi saat ini (contoh id profil: `anthropic:default`, `anthropic:work`).

Gunakan `/model` (atau `/model list`) untuk pemilih ringkas; gunakan `/model status` untuk tampilan penuh (kandidat + profil auth berikutnya, serta detail endpoint penyedia jika dikonfigurasi).

### Per agen (override CLI)

Setel override urutan profil auth eksplisit untuk agen (disimpan di `auth-state.json` agen tersebut):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan untuk menggunakan agen default yang dikonfigurasi.
Saat Anda men-debug masalah urutan, `openclaw models status --probe` menampilkan profil tersimpan
yang dihilangkan sebagai `excluded_by_auth_order` alih-alih melewatinya secara diam-diam.
Saat Anda men-debug masalah cooldown, ingat bahwa cooldown rate limit dapat terikat
pada satu id model, bukan seluruh profil penyedia.

## Pemecahan masalah

### "No credentials found"

Jika profil Anthropic tidak ada, konfigurasikan API key Anthropic di
**host gateway** atau siapkan jalur setup-token Anthropic, lalu periksa kembali:

```bash
openclaw models status
```

### Token akan kedaluwarsa/sudah kedaluwarsa

Jalankan `openclaw models status` untuk mengonfirmasi profil mana yang akan kedaluwarsa. Jika profil token
Anthropic tidak ada atau sudah kedaluwarsa, segarkan penyiapan tersebut melalui
setup-token atau migrasikan ke API key Anthropic.
