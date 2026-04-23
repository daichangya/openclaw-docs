---
read_when:
    - Menjalankan OpenClaw di belakang proxy yang sadar identitas
    - Menyiapkan Pomerium, Caddy, atau nginx dengan OAuth di depan OpenClaw
    - Memperbaiki error WebSocket 1008 unauthorized dengan penyiapan reverse proxy
    - Menentukan tempat menyetel HSTS dan header hardening HTTP lainnya
summary: Delegasikan autentikasi Gateway ke reverse proxy tepercaya (Pomerium, Caddy, nginx + OAuth)
title: Auth Proxy Tepercaya
x-i18n:
    generated_at: "2026-04-23T09:21:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Auth Proxy Tepercaya

> ⚠️ **Fitur sensitif terhadap keamanan.** Mode ini mendelegasikan autentikasi sepenuhnya ke reverse proxy Anda. Kesalahan konfigurasi dapat membuat Gateway Anda terekspos ke akses tidak sah. Baca halaman ini dengan saksama sebelum mengaktifkan.

## Kapan Digunakan

Gunakan mode auth `trusted-proxy` ketika:

- Anda menjalankan OpenClaw di belakang **proxy yang sadar identitas** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Proxy Anda menangani seluruh autentikasi dan meneruskan identitas pengguna melalui header
- Anda berada dalam lingkungan Kubernetes atau container di mana proxy adalah satu-satunya jalur ke Gateway
- Anda mengalami error WebSocket `1008 unauthorized` karena browser tidak bisa meneruskan token dalam payload WS

## Kapan TIDAK Digunakan

- Jika proxy Anda tidak mengautentikasi pengguna (hanya terminator TLS atau load balancer)
- Jika ada jalur apa pun ke Gateway yang melewati proxy (celah firewall, akses jaringan internal)
- Jika Anda tidak yakin apakah proxy Anda dengan benar menghapus/menimpa forwarded header
- Jika Anda hanya membutuhkan akses pribadi pengguna tunggal (pertimbangkan Tailscale Serve + loopback untuk penyiapan yang lebih sederhana)

## Cara Kerjanya

1. Reverse proxy Anda mengautentikasi pengguna (OAuth, OIDC, SAML, dll.)
2. Proxy menambahkan header dengan identitas pengguna yang telah diautentikasi (misalnya, `x-forwarded-user: nick@example.com`)
3. OpenClaw memeriksa bahwa permintaan berasal dari **IP proxy tepercaya** (dikonfigurasi dalam `gateway.trustedProxies`)
4. OpenClaw mengekstrak identitas pengguna dari header yang dikonfigurasi
5. Jika semuanya sesuai, permintaan diotorisasi

## Perilaku Pairing Control UI

Saat `gateway.auth.mode = "trusted-proxy"` aktif dan permintaan lolos
pemeriksaan trusted-proxy, sesi WebSocket Control UI dapat terhubung tanpa
identitas device pairing.

Implikasi:

- Pairing bukan lagi gerbang utama untuk akses Control UI dalam mode ini.
- Kebijakan auth reverse proxy Anda dan `allowUsers` menjadi kontrol akses yang efektif.
- Jaga ingress Gateway tetap terkunci hanya ke IP proxy tepercaya (`gateway.trustedProxies` + firewall).

## Konfigurasi

```json5
{
  gateway: {
    // Auth trusted-proxy mengharapkan permintaan dari sumber proxy tepercaya non-loopback
    bind: "lan",

    // KRITIS: Tambahkan hanya IP proxy Anda di sini
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header yang berisi identitas pengguna yang telah diautentikasi (wajib)
        userHeader: "x-forwarded-user",

        // Opsional: header yang HARUS ada (verifikasi proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opsional: batasi ke pengguna tertentu (kosong = izinkan semua)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Aturan runtime penting:

- Auth trusted-proxy menolak permintaan dari sumber loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Reverse proxy loopback pada host yang sama **tidak** memenuhi auth trusted-proxy.
- Untuk penyiapan proxy loopback pada host yang sama, gunakan auth token/password, atau rute melalui alamat proxy tepercaya non-loopback yang dapat diverifikasi OpenClaw.
- Deployment Control UI non-loopback tetap memerlukan `gateway.controlUi.allowedOrigins` eksplisit.
- **Bukti forwarded-header menimpa lokalitas loopback.** Jika sebuah permintaan datang melalui loopback tetapi membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` yang menunjuk ke asal non-lokal, bukti tersebut menggugurkan klaim lokalitas loopback. Permintaan diperlakukan sebagai remote untuk pairing, auth trusted-proxy, dan gating identitas perangkat Control UI. Ini mencegah proxy loopback pada host yang sama mencuci identitas forwarded-header ke dalam auth trusted-proxy.

### Referensi Konfigurasi

| Field                                       | Wajib | Deskripsi                                                                 |
| ------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Ya    | Array alamat IP proxy yang dipercaya. Permintaan dari IP lain ditolak.    |
| `gateway.auth.mode`                         | Ya    | Harus `"trusted-proxy"`                                                   |
| `gateway.auth.trustedProxy.userHeader`      | Ya    | Nama header yang berisi identitas pengguna yang telah diautentikasi       |
| `gateway.auth.trustedProxy.requiredHeaders` | Tidak | Header tambahan yang harus ada agar permintaan dipercaya                  |
| `gateway.auth.trustedProxy.allowUsers`      | Tidak | Allowlist identitas pengguna. Kosong berarti izinkan semua pengguna yang telah diautentikasi. |

## Terminasi TLS dan HSTS

Gunakan satu titik terminasi TLS dan terapkan HSTS di sana.

### Pola yang direkomendasikan: terminasi TLS proxy

Saat reverse proxy Anda menangani HTTPS untuk `https://control.example.com`, setel
`Strict-Transport-Security` di proxy untuk domain tersebut.

- Cocok untuk deployment yang menghadap internet.
- Menjaga sertifikat + kebijakan hardening HTTP di satu tempat.
- OpenClaw dapat tetap menggunakan HTTP loopback di belakang proxy.

Contoh nilai header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminasi TLS Gateway

Jika OpenClaw sendiri menyajikan HTTPS secara langsung (tanpa proxy yang melakukan terminasi TLS), setel:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` menerima nilai header string, atau `false` untuk menonaktifkannya secara eksplisit.

### Panduan rollout

- Mulailah dengan max age singkat terlebih dahulu (misalnya `max-age=300`) saat memvalidasi lalu lintas.
- Tingkatkan ke nilai yang lebih lama (misalnya `max-age=31536000`) hanya setelah keyakinan tinggi.
- Tambahkan `includeSubDomains` hanya jika setiap subdomain sudah siap HTTPS.
- Gunakan preload hanya jika Anda memang memenuhi persyaratan preload untuk seluruh kumpulan domain Anda.
- Pengembangan lokal loopback-only tidak mendapat manfaat dari HSTS.

## Contoh Penyiapan Proxy

### Pomerium

Pomerium meneruskan identitas dalam `x-pomerium-claim-email` (atau header klaim lainnya) dan JWT dalam `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Cuplikan config Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy dengan OAuth

Caddy dengan Plugin `caddy-security` dapat mengautentikasi pengguna dan meneruskan header identitas.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP Caddy/sidecar proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Cuplikan Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy mengautentikasi pengguna dan meneruskan identitas dalam `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Cuplikan config nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik dengan Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP container Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Konfigurasi token campuran

OpenClaw menolak konfigurasi ambigu ketika `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`) dan mode `trusted-proxy` aktif pada saat yang sama. Konfigurasi token campuran dapat menyebabkan permintaan loopback diautentikasi secara diam-diam melalui jalur auth yang salah.

Jika Anda melihat error `mixed_trusted_proxy_token` saat startup:

- Hapus shared token saat menggunakan mode trusted-proxy, atau
- Ubah `gateway.auth.mode` ke `"token"` jika Anda memang bermaksud menggunakan auth berbasis token.

Auth trusted-proxy loopback juga gagal tertutup: pemanggil pada host yang sama harus menyediakan header identitas yang dikonfigurasi melalui proxy tepercaya alih-alih diautentikasi secara diam-diam.

## Header cakupan operator

Auth trusted-proxy adalah mode HTTP **pembawa identitas**, sehingga pemanggil
dapat secara opsional mendeklarasikan cakupan operator dengan `x-openclaw-scopes`.

Contoh:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Perilaku:

- Saat header ada, OpenClaw menghormati kumpulan cakupan yang dideklarasikan.
- Saat header ada tetapi kosong, permintaan mendeklarasikan **tidak ada** cakupan operator.
- Saat header tidak ada, API HTTP pembawa identitas normal fallback ke kumpulan cakupan default operator standar.
- **Rute HTTP Plugin** dengan auth Gateway secara default lebih sempit: saat `x-openclaw-scopes` tidak ada, cakupan runtime-nya fallback ke `operator.write`.
- Permintaan HTTP yang berasal dari browser tetap harus lolos `gateway.controlUi.allowedOrigins` (atau mode fallback Host-header yang disengaja) bahkan setelah auth trusted-proxy berhasil.

Aturan praktis:

- Kirim `x-openclaw-scopes` secara eksplisit saat Anda ingin permintaan trusted-proxy
  lebih sempit daripada default, atau saat rute Plugin dengan auth Gateway membutuhkan
  sesuatu yang lebih kuat daripada cakupan write.

## Checklist Keamanan

Sebelum mengaktifkan auth trusted-proxy, verifikasi:

- [ ] **Proxy adalah satu-satunya jalur**: Port Gateway dibatasi firewall dari semua hal kecuali proxy Anda
- [ ] **trustedProxies minimal**: Hanya IP proxy Anda yang sebenarnya, bukan seluruh subnet
- [ ] **Tidak ada sumber proxy loopback**: auth trusted-proxy gagal tertutup untuk permintaan dari sumber loopback
- [ ] **Proxy menghapus header**: Proxy Anda menimpa (bukan menambahkan) header `x-forwarded-*` dari klien
- [ ] **Terminasi TLS**: Proxy Anda menangani TLS; pengguna terhubung melalui HTTPS
- [ ] **allowedOrigins eksplisit**: Control UI non-loopback menggunakan `gateway.controlUi.allowedOrigins` eksplisit
- [ ] **allowUsers disetel** (direkomendasikan): Batasi ke pengguna yang dikenal alih-alih mengizinkan siapa pun yang telah diautentikasi
- [ ] **Tidak ada konfigurasi token campuran**: Jangan setel `gateway.auth.token` dan `gateway.auth.mode: "trusted-proxy"` sekaligus

## Audit Keamanan

`openclaw security audit` akan menandai auth trusted-proxy dengan temuan tingkat **kritis**. Ini disengaja — pengingat bahwa Anda mendelegasikan keamanan ke penyiapan proxy Anda.

Audit memeriksa:

- Peringatan/pengingat kritis dasar `gateway.trusted_proxy_auth`
- Konfigurasi `trustedProxies` yang hilang
- Konfigurasi `userHeader` yang hilang
- `allowUsers` kosong (mengizinkan pengguna terautentikasi mana pun)
- Kebijakan origin browser wildcard atau hilang pada permukaan Control UI yang terekspos

## Pemecahan Masalah

### "trusted_proxy_untrusted_source"

Permintaan tidak berasal dari IP dalam `gateway.trustedProxies`. Periksa:

- Apakah IP proxy benar? (IP container Docker dapat berubah)
- Apakah ada load balancer di depan proxy Anda?
- Gunakan `docker inspect` atau `kubectl get pods -o wide` untuk menemukan IP sebenarnya

### "trusted_proxy_loopback_source"

OpenClaw menolak permintaan trusted-proxy dari sumber loopback.

Periksa:

- Apakah proxy terhubung dari `127.0.0.1` / `::1`?
- Apakah Anda mencoba menggunakan auth trusted-proxy dengan reverse proxy loopback pada host yang sama?

Perbaikan:

- Gunakan auth token/password untuk penyiapan proxy loopback pada host yang sama, atau
- Rute melalui alamat proxy tepercaya non-loopback dan pertahankan IP tersebut di `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

Header pengguna kosong atau tidak ada. Periksa:

- Apakah proxy Anda dikonfigurasi untuk meneruskan header identitas?
- Apakah nama header benar? (tidak peka huruf besar/kecil, tetapi ejaan penting)
- Apakah pengguna benar-benar telah diautentikasi di proxy?

### "trusted*proxy_missing_header*\*"

Header wajib tidak ada. Periksa:

- Konfigurasi proxy Anda untuk header spesifik tersebut
- Apakah header dihapus di suatu titik dalam rantai

### "trusted_proxy_user_not_allowed"

Pengguna telah diautentikasi tetapi tidak ada di `allowUsers`. Tambahkan pengguna itu atau hapus allowlist.

### "trusted_proxy_origin_not_allowed"

Auth trusted-proxy berhasil, tetapi header `Origin` browser tidak lolos pemeriksaan origin Control UI.

Periksa:

- `gateway.controlUi.allowedOrigins` mencakup origin browser yang persis
- Anda tidak mengandalkan origin wildcard kecuali memang sengaja menginginkan perilaku izinkan-semua
- Jika Anda sengaja menggunakan mode fallback Host-header, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` disetel dengan sengaja

### WebSocket Masih Gagal

Pastikan proxy Anda:

- Mendukung upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Meneruskan header identitas pada permintaan upgrade WebSocket (bukan hanya HTTP)
- Tidak memiliki jalur auth terpisah untuk koneksi WebSocket

## Migrasi dari Auth Token

Jika Anda berpindah dari auth token ke trusted-proxy:

1. Konfigurasikan proxy Anda untuk mengautentikasi pengguna dan meneruskan header
2. Uji penyiapan proxy secara independen (`curl` dengan header)
3. Perbarui config OpenClaw dengan auth trusted-proxy
4. Mulai ulang Gateway
5. Uji koneksi WebSocket dari Control UI
6. Jalankan `openclaw security audit` dan tinjau temuannya

## Terkait

- [Keamanan](/id/gateway/security) — panduan keamanan lengkap
- [Konfigurasi](/id/gateway/configuration) — referensi config
- [Akses Remote](/id/gateway/remote) — pola akses remote lainnya
- [Tailscale](/id/gateway/tailscale) — alternatif yang lebih sederhana untuk akses khusus tailnet
