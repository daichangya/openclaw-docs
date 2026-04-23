---
read_when:
    - Mengubah mode autentikasi atau eksposur dashboard
summary: Akses dan auth dashboard Gateway (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-23T09:30:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

Dashboard Gateway adalah Control UI berbasis browser yang disajikan di `/` secara default
(timpa dengan `gateway.controlUi.basePath`).

Buka cepat (Gateway lokal):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Referensi utama:

- [Control UI](/id/web/control-ui) untuk penggunaan dan kapabilitas UI.
- [Tailscale](/id/gateway/tailscale) untuk otomatisasi Serve/Funnel.
- [Permukaan web](/id/web) untuk mode bind dan catatan keamanan.

Autentikasi ditegakkan pada handshake WebSocket melalui jalur auth gateway yang dikonfigurasi:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- Header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Lihat `gateway.auth` di [Konfigurasi Gateway](/id/gateway/configuration).

Catatan keamanan: Control UI adalah **permukaan admin** (obrolan, config, persetujuan exec).
Jangan mengeksposnya secara publik. UI menyimpan token URL dashboard di sessionStorage
untuk sesi tab browser saat ini dan URL gateway yang dipilih, lalu menghapusnya dari URL setelah dimuat.
Utamakan localhost, Tailscale Serve, atau tunnel SSH.

## Jalur cepat (direkomendasikan)

- Setelah onboarding, CLI otomatis membuka dashboard dan mencetak tautan bersih (tanpa token).
- Buka kembali kapan saja: `openclaw dashboard` (menyalin tautan, membuka browser jika memungkinkan, menampilkan petunjuk SSH jika headless).
- Jika UI meminta auth shared-secret, tempel token atau
  password yang dikonfigurasi ke pengaturan Control UI.

## Dasar auth (lokal vs remote)

- **Localhost**: buka `http://127.0.0.1:18789/`.
- **Sumber token shared-secret**: `gateway.auth.token` (atau
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` dapat meneruskannya melalui fragmen URL
  untuk bootstrap sekali pakai, dan Control UI menyimpannya di sessionStorage untuk
  sesi tab browser saat ini dan URL gateway yang dipilih, bukan di localStorage.
- Jika `gateway.auth.token` dikelola SecretRef, `openclaw dashboard`
  mencetak/menyalin/membuka URL tanpa token secara sengaja. Ini menghindari
  tereksposnya token yang dikelola secara eksternal di log shell, riwayat clipboard, atau
  argumen peluncuran browser.
- Jika `gateway.auth.token` dikonfigurasi sebagai SecretRef dan tidak dapat di-resolve di
  shell Anda saat ini, `openclaw dashboard` tetap mencetak URL tanpa token plus
  panduan penyiapan auth yang dapat ditindaklanjuti.
- **Password shared-secret**: gunakan `gateway.auth.password` yang dikonfigurasi (atau
  `OPENCLAW_GATEWAY_PASSWORD`). Dashboard tidak mempertahankan password setelah
  reload.
- **Mode pembawa identitas**: Tailscale Serve dapat memenuhi auth
  Control UI/WebSocket melalui header identitas saat `gateway.auth.allowTailscale: true`, dan
  reverse proxy sadar identitas non-loopback dapat memenuhi
  `gateway.auth.mode: "trusted-proxy"`. Dalam mode tersebut dashboard tidak
  memerlukan shared secret yang ditempel untuk WebSocket.
- **Bukan localhost**: gunakan Tailscale Serve, bind shared-secret non-loopback,
  reverse proxy sadar identitas non-loopback dengan
  `gateway.auth.mode: "trusted-proxy"`, atau tunnel SSH. API HTTP tetap menggunakan
  auth shared-secret kecuali Anda memang sengaja menjalankan ingress privat
  `gateway.auth.mode: "none"` atau auth HTTP trusted-proxy. Lihat
  [Permukaan web](/id/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jika Anda melihat "unauthorized" / 1008

- Pastikan gateway dapat dijangkau (lokal: `openclaw status`; remote: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`).
- Untuk `AUTH_TOKEN_MISMATCH`, klien dapat melakukan satu retry tepercaya dengan token perangkat cache ketika gateway mengembalikan petunjuk retry. Retry token cache tersebut menggunakan kembali cakupan yang disetujui dan disimpan untuk token itu; pemanggil `deviceToken` eksplisit / `scopes` eksplisit mempertahankan kumpulan cakupan yang diminta. Jika auth masih gagal setelah retry itu, selesaikan drift token secara manual.
- Di luar jalur retry tersebut, prioritas auth connect bersifat eksplisit: shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
- Pada jalur async Tailscale Serve Control UI, percobaan gagal untuk
  `{scope, ip}` yang sama diserialkan sebelum limiter failed-auth mencatatnya, sehingga retry buruk kedua yang bersamaan sudah dapat menampilkan `retry later`.
- Untuk langkah perbaikan drift token, ikuti [Checklist pemulihan drift token](/id/cli/devices#token-drift-recovery-checklist).
- Ambil atau sediakan shared secret dari host gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: resolve `gateway.auth.password` yang dikonfigurasi atau
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token yang dikelola SecretRef: resolve provider secret eksternal atau ekspor
    `OPENCLAW_GATEWAY_TOKEN` di shell ini, lalu jalankan ulang `openclaw dashboard`
  - Tidak ada shared secret yang dikonfigurasi: `openclaw doctor --generate-gateway-token`
- Di pengaturan dashboard, tempel token atau password ke field auth,
  lalu sambungkan.
- Picker bahasa UI ada di **Overview -> Gateway Access -> Language**.
  Itu adalah bagian dari kartu akses, bukan bagian Appearance.
