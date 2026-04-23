---
read_when:
    - Anda ingin mengakses Gateway melalui Tailscale
    - Anda ingin Control UI berbasis browser dan pengeditan config
summary: 'Permukaan web Gateway: Control UI, mode bind, dan keamanan'
title: Web
x-i18n:
    generated_at: "2026-04-23T09:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Gateway menyajikan **Control UI** berbasis browser kecil (Vite + Lit) dari port yang sama dengan Gateway WebSocket:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

Kapabilitas ada di [Control UI](/id/web/control-ui).
Halaman ini berfokus pada mode bind, keamanan, dan permukaan yang menghadap web.

## Webhook

Saat `hooks.enabled=true`, Gateway juga mengekspos endpoint webhook kecil pada server HTTP yang sama.
Lihat [Konfigurasi Gateway](/id/gateway/configuration) → `hooks` untuk auth + payload.

## Config (aktif secara default)

Control UI **aktif secara default** saat aset tersedia (`dist/control-ui`).
Anda dapat mengontrolnya melalui config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opsional
  },
}
```

## Akses Tailscale

### Serve terintegrasi (disarankan)

Pertahankan Gateway di loopback dan biarkan Tailscale Serve mem-proxy-nya:

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

Lalu mulai gateway (contoh non-loopback ini menggunakan auth token
shared-secret):

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

- Auth Gateway diwajibkan secara default (token, password, trusted-proxy, atau header identitas Tailscale Serve saat diaktifkan).
- Bind non-loopback tetap **memerlukan** auth gateway. Dalam praktiknya ini berarti auth token/password atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- Wizard membuat auth shared-secret secara default dan biasanya menghasilkan
  token gateway (bahkan pada loopback).
- Dalam mode shared-secret, UI mengirim `connect.params.auth.token` atau
  `connect.params.auth.password`.
- Dalam mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy`, pemeriksaan auth WebSocket dipenuhi dari header permintaan sebagai gantinya.
- Untuk deployment Control UI non-loopback, atur `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin lengkap). Tanpanya, startup gateway ditolak secara default.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan
  mode fallback origin Host-header, tetapi ini merupakan penurunan keamanan yang berbahaya.
- Dengan Serve, header identitas Tailscale dapat memenuhi auth Control UI/WebSocket
  saat `gateway.auth.allowTailscale` bernilai `true` (tanpa token/password).
  Endpoint HTTP API tidak menggunakan header identitas Tailscale tersebut; endpoint itu mengikuti
  mode auth HTTP normal gateway sebagai gantinya. Atur
  `gateway.auth.allowTailscale: false` untuk mewajibkan kredensial eksplisit. Lihat
  [Tailscale](/id/gateway/tailscale) dan [Keamanan](/id/gateway/security). Alur
  tanpa token ini mengasumsikan host gateway tepercaya.
- `gateway.tailscale.mode: "funnel"` memerlukan `gateway.auth.mode: "password"` (password bersama).

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build
```
