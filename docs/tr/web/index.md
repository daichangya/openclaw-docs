---
read_when:
    - Gateway'e Tailscale üzerinden erişmek istiyorsunuz
    - Tarayıcıda Control UI ve yapılandırma düzenleme istiyorsunuz
summary: 'Gateway web yüzeyleri: Control UI, bind modları ve güvenlik'
title: Web
x-i18n:
    generated_at: "2026-04-23T09:13:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Gateway, Gateway WebSocket ile aynı porttan küçük bir **tarayıcı Control UI** (Vite + Lit) sunar:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

Yetenekler [Control UI](/tr/web/control-ui) bölümünde bulunur.
Bu sayfa bind modları, güvenlik ve web'e dönük yüzeylere odaklanır.

## Webhook'lar

`hooks.enabled=true` olduğunda Gateway, aynı HTTP sunucusu üzerinde küçük bir Webhook uç noktası da açığa çıkarır.
Auth + payload'lar için bkz. [Gateway configuration](/tr/gateway/configuration) → `hooks`.

## Yapılandırma (varsayılan olarak açık)

Control UI, varlıklar mevcutsa (`dist/control-ui`) **varsayılan olarak etkindir**.
Bunu yapılandırma ile kontrol edebilirsiniz:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath isteğe bağlı
  },
}
```

## Tailscale erişimi

### Entegre Serve (önerilir)

Gateway'i loopback üzerinde tutun ve Tailscale Serve'in onu proxy'lemesine izin verin:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Ardından Gateway'i başlatın:

```bash
openclaw gateway
```

Şunu açın:

- `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

### Tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Ardından Gateway'i başlatın (bu loopback dışı örnek paylaşılan sır token
auth kullanır):

```bash
openclaw gateway
```

Şunu açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath`)

### Herkese açık internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // veya OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Güvenlik notları

- Gateway auth varsayılan olarak gereklidir (token, parola, trusted-proxy veya etkinleştirildiğinde Tailscale Serve kimlik header'ları).
- Loopback dışı bind'ler yine de **Gateway auth gerektirir**. Pratikte bu, token/parola auth veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir ters proxy anlamına gelir.
- Sihirbaz varsayılan olarak paylaşılan sır auth oluşturur ve genellikle bir
  Gateway token'ı üretir (loopback'te bile).
- Paylaşılan sır modunda UI, `connect.params.auth.token` veya
  `connect.params.auth.password` gönderir.
- Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlarda ise
  WebSocket auth denetimi bunun yerine istek header'larından sağlanır.
- Loopback dışı Control UI dağıtımları için `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlayın (tam origin'ler). Bu olmadan Gateway başlangıcı varsayılan olarak reddedilir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`,
  Host-header origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik düşüşüdür.
- Serve ile, `gateway.auth.allowTailscale` değeri `true` olduğunda Tailscale kimlik header'ları
  Control UI/WebSocket auth'u karşılayabilir (token/parola gerekmez).
  HTTP API uç noktaları bu Tailscale kimlik header'larını kullanmaz; bunun yerine
  Gateway'in normal HTTP auth modunu izler. Açık kimlik bilgileri gerektirmek için
  `gateway.auth.allowTailscale: false` ayarlayın. Bkz.
  [Tailscale](/tr/gateway/tailscale) ve [Güvenlik](/tr/gateway/security). Bu
  tokensız akış, Gateway host'una güvenildiğini varsayar.
- `gateway.tailscale.mode: "funnel"`, `gateway.auth.mode: "password"` (paylaşılan parola) gerektirir.

## UI'yi build etme

Gateway, statik dosyaları `dist/control-ui` içinden sunar. Bunları şununla build edin:

```bash
pnpm ui:build
```
