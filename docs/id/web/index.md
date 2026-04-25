---
read_when:
    - Anda ingin mengakses Gateway melalui Tailscale
    - Anda ingin Control UI browser dan pengeditan konfigurasi
summary: 'Permukaan web Gateway: Control UI, mode bind, dan keamanan'
title: Web
x-i18n:
    generated_at: "2026-04-25T13:59:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gateway menyajikan **Control UI** browser kecil (Vite + Lit) dari port yang sama dengan WebSocket Gateway:

- default: `http://<host>:18789/`
- dengan `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefix opsional: setel `gateway.controlUi.basePath` (misalnya `/openclaw`)

Kapabilitas ada di [Control UI](/id/web/control-ui).
Halaman ini berfokus pada mode bind, keamanan, dan permukaan yang menghadap web.

## Webhook

Ketika `hooks.enabled=true`, Gateway juga mengekspos endpoint Webhook kecil pada server HTTP yang sama.
Lihat [Konfigurasi gateway](/id/gateway/configuration) → `hooks` untuk auth + payload.

## Konfigurasi (aktif secara default)

Control UI **aktif secara default** ketika aset tersedia (`dist/control-ui`).
Anda dapat mengontrolnya melalui konfigurasi:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opsional
  },
}
```

## Akses Tailscale

### Serve terintegrasi (direkomendasikan)

Biarkan Gateway pada loopback lokal dan biarkan Tailscale Serve memproksikannya:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Lalu mulai gateway:

```bash
openclaw gateway
```

Buka:

- `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

### Bind tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Lalu mulai gateway (contoh non-loopback ini menggunakan
auth token shared-secret):

```bash
openclaw gateway
```

Buka:

- `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

### Internet publik (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // atau OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Catatan keamanan

- Auth gateway diwajibkan secara default (token, password, trusted-proxy, atau header identitas Tailscale Serve ketika diaktifkan).
- Bind non-loopback tetap **memerlukan** auth gateway. Dalam praktiknya itu berarti auth token/password atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Wizard membuat auth shared-secret secara default dan biasanya menghasilkan
  token gateway (bahkan pada loopback).
- Dalam mode shared-secret, UI mengirim `connect.params.auth.token` atau
  `connect.params.auth.password`.
- Ketika `gateway.tls.enabled: true`, helper dashboard dan status lokal merender
  URL dashboard `https://` dan URL WebSocket `wss://`.
- Dalam mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy`, pemeriksaan
  auth WebSocket dipenuhi dari header permintaan.
- Untuk deployment Control UI non-loopback, setel `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin lengkap). Tanpanya, startup gateway akan ditolak secara default.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan
  mode fallback origin header Host, tetapi ini adalah penurunan keamanan yang berbahaya.
- Dengan Serve, header identitas Tailscale dapat memenuhi auth Control UI/WebSocket
  ketika `gateway.auth.allowTailscale` adalah `true` (tidak memerlukan token/password).
  Endpoint HTTP API tidak menggunakan header identitas Tailscale tersebut; mereka mengikuti
  mode auth HTTP normal gateway sebagai gantinya. Setel
  `gateway.auth.allowTailscale: false` untuk mewajibkan kredensial eksplisit. Lihat
  [Tailscale](/id/gateway/tailscale) dan [Keamanan](/id/gateway/security). Alur
  tanpa token ini mengasumsikan host gateway tepercaya.
- `gateway.tailscale.mode: "funnel"` memerlukan `gateway.auth.mode: "password"` (password bersama).

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

```bash
pnpm ui:build
```
