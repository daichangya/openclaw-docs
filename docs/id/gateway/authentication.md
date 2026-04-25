---
read_when:
    - Men-debug autentikasi model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, API key, penggunaan ulang Claude CLI, dan setup-token Anthropic'
title: Autentikasi
x-i18n:
    generated_at: "2026-04-25T13:45:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
Halaman ini membahas autentikasi **penyedia model** (API key, OAuth, penggunaan ulang Claude CLI, dan setup-token Anthropic). Untuk autentikasi **koneksi gateway** (token, password, trusted-proxy), lihat [Configuration](/id/gateway/configuration) dan [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan API key untuk penyedia model. Untuk host gateway
yang selalu aktif, API key biasanya merupakan opsi yang paling dapat diprediksi. Alur
subscription/OAuth juga didukung jika sesuai dengan model akun penyedia Anda.

Lihat [/concepts/oauth](/id/concepts/oauth) untuk alur OAuth lengkap dan tata letak
penyimpanan.
Untuk autentikasi berbasis SecretRef (penyedia `env`/`file`/`exec`), lihat [Secrets Management](/id/gateway/secrets).
Untuk aturan kelayakan kredensial/kode alasan yang digunakan oleh `models status --probe`, lihat
[Auth Credential Semantics](/id/auth-credential-semantics).

## Penyiapan yang direkomendasikan (API key, penyedia apa pun)

Jika Anda menjalankan gateway yang berumur panjang, mulailah dengan API key untuk
penyedia pilihan Anda.
Khusus untuk Anthropic, autentikasi API key tetap merupakan penyiapan server yang paling dapat
diprediksi, tetapi OpenClaw juga mendukung penggunaan ulang login Claude CLI lokal.

1. Buat API key di konsol penyedia Anda.
2. Letakkan di **host gateway** (mesin yang menjalankan `openclaw gateway`).

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

Lalu mulai ulang daemon (atau mulai ulang proses Gateway Anda) dan periksa ulang:

```bash
openclaw models status
openclaw doctor
```

Jika Anda tidak ingin mengelola variabel env sendiri, onboarding dapat menyimpan
API key untuk penggunaan daemon: `openclaw onboard`.

Lihat [Help](/id/help) untuk detail tentang pewarisan env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: kompatibilitas Claude CLI dan token

Autentikasi setup-token Anthropic masih tersedia di OpenClaw sebagai jalur token
yang didukung. Staf Anthropic sejak itu memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw
diizinkan lagi, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
diizinkan untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika
penggunaan ulang Claude CLI tersedia di host, itu sekarang menjadi jalur yang lebih disarankan.

Untuk host gateway yang berumur panjang, API key Anthropic tetap merupakan
penyiapan yang paling dapat diprediksi. Jika Anda ingin menggunakan ulang login Claude yang ada pada host yang sama, gunakan
jalur Anthropic Claude CLI di onboarding/configure.

Penyiapan host yang direkomendasikan untuk penggunaan ulang Claude CLI:

```bash
# Jalankan di host gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Ini adalah penyiapan dua langkah:

1. Login-kan Claude Code itu sendiri ke Anthropic pada host gateway.
2. Beri tahu OpenClaw untuk mengalihkan pemilihan model Anthropic ke backend `claude-cli`
   lokal dan menyimpan profil autentikasi OpenClaw yang sesuai.

Jika `claude` tidak ada di `PATH`, instal Claude Code terlebih dahulu atau tetapkan
`agents.defaults.cliBackends.claude-cli.command` ke jalur biner yang sebenarnya.

Entri token manual (penyedia apa pun; menulis `auth-profiles.json` + memperbarui config):

```bash
openclaw models auth paste-token --provider openrouter
```

Referensi profil autentikasi juga didukung untuk kredensial statis:

- Kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- Kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- Profil mode OAuth tidak mendukung kredensial SecretRef; jika `auth.profiles.<id>.mode` ditetapkan ke `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut akan ditolak.

Pemeriksaan yang ramah otomatisasi (exit `1` saat kedaluwarsa/tidak ada, `2` saat akan kedaluwarsa):

```bash
openclaw models status --check
```

Probe autentikasi langsung:

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.
- Jika `auth.order.<provider>` yang eksplisit menghilangkan profil yang disimpan, probe melaporkan
  `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya.
- Jika autentikasi ada tetapi OpenClaw tidak dapat me-resolve kandidat model yang dapat di-probe untuk
  penyedia tersebut, probe melaporkan `status: no_model`.
- Cooldown rate-limit dapat dibatasi per model. Profil yang sedang cooldown untuk satu
  model masih dapat digunakan untuk model saudara pada penyedia yang sama.

Skrip ops opsional (systemd/Termux) didokumentasikan di sini:
[Auth monitoring scripts](/id/help/scripts#auth-monitoring-scripts)

## Catatan Anthropic

Backend `claude-cli` Anthropic didukung lagi.

- Staf Anthropic memberi tahu kami bahwa jalur integrasi OpenClaw ini diizinkan lagi.
- Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
  diizinkan untuk eksekusi berbasis Anthropic kecuali Anthropic menerbitkan kebijakan baru.
- API key Anthropic tetap menjadi pilihan yang paling dapat diprediksi untuk host gateway
  berumur panjang dan kontrol penagihan sisi server yang eksplisit.

## Memeriksa status autentikasi model

```bash
openclaw models status
openclaw doctor
```

## Perilaku rotasi API key (gateway)

Beberapa penyedia mendukung percobaan ulang permintaan dengan key alternatif ketika panggilan API
mencapai rate limit penyedia.

- Urutan prioritas:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (satu override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Penyedia Google juga menyertakan `GOOGLE_API_KEY` sebagai fallback tambahan.
- Daftar key yang sama dihapus duplikasinya sebelum digunakan.
- OpenClaw mencoba ulang dengan key berikutnya hanya untuk error rate-limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, atau
  `workers_ai ... quota limit exceeded`).
- Error non-rate-limit tidak dicoba ulang dengan key alternatif.
- Jika semua key gagal, error akhir dari percobaan terakhir akan dikembalikan.

## Mengontrol kredensial mana yang digunakan

### Per sesi (perintah chat)

Gunakan `/model <alias-or-id>@<profileId>` untuk menyematkan kredensial penyedia tertentu untuk sesi saat ini (contoh ID profil: `anthropic:default`, `anthropic:work`).

Gunakan `/model` (atau `/model list`) untuk pemilih ringkas; gunakan `/model status` untuk tampilan lengkap (kandidat + profil autentikasi berikutnya, ditambah detail endpoint penyedia jika dikonfigurasi).

### Per agen (override CLI)

Tetapkan override urutan profil autentikasi eksplisit untuk sebuah agen (disimpan di `auth-state.json` agen tersebut):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan untuk menggunakan agen default yang dikonfigurasi.
Saat Anda men-debug masalah urutan, `openclaw models status --probe` menampilkan profil tersimpan yang dihilangkan
sebagai `excluded_by_auth_order` alih-alih melewatinya secara diam-diam.
Saat Anda men-debug masalah cooldown, ingat bahwa cooldown rate-limit dapat terikat
ke satu ID model, bukan seluruh profil penyedia.

## Pemecahan masalah

### "No credentials found"

Jika profil Anthropic tidak ada, konfigurasikan API key Anthropic pada
**host gateway** atau siapkan jalur setup-token Anthropic, lalu periksa ulang:

```bash
openclaw models status
```

### Token akan kedaluwarsa/sudah kedaluwarsa

Jalankan `openclaw models status` untuk memastikan profil mana yang akan kedaluwarsa. Jika profil token
Anthropic tidak ada atau sudah kedaluwarsa, segarkan penyiapan tersebut melalui
setup-token atau migrasikan ke API key Anthropic.

## Terkait

- [Secrets management](/id/gateway/secrets)
- [Akses jarak jauh](/id/gateway/remote)
- [Penyimpanan autentikasi](/id/concepts/oauth)
