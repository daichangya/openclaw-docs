---
read_when:
    - Gateway'e Tailscale üzerinden erişmek istiyorsunuz
    - Tarayıcıdaki Control UI ve yapılandırma düzenlemeyi istiyorsunuz
summary: 'Gateway web yüzeyleri: Control UI, bağlama modları ve güvenlik'
title: Web
x-i18n:
    generated_at: "2026-04-25T14:01:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gateway, Gateway WebSocket ile aynı bağlantı noktasından küçük bir **tarayıcı Control UI** (Vite + Lit) sunar:

- varsayılan: `http://<host>:18789/`
- `gateway.tls.enabled: true` ile: `https://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

Yetenekler [Control UI](/tr/web/control-ui) içinde yer alır.
Bu sayfa bağlama modlarına, güvenliğe ve web'e dönük yüzeylere odaklanır.

## Webhook'lar

`hooks.enabled=true` olduğunda Gateway, aynı HTTP sunucusunda küçük bir Webhook uç noktası da sunar.
Kimlik doğrulama + yükler için bkz. [Gateway yapılandırması](/tr/gateway/configuration) → `hooks`.

## Yapılandırma (varsayılan olarak açık)

Control UI, varlıklar mevcut olduğunda (`dist/control-ui`) **varsayılan olarak etkindir**.
Bunu yapılandırma üzerinden denetleyebilirsiniz:

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

Ardından gateway'i başlatın:

```bash
openclaw gateway
```

Şunu açın:

- `https://<magicdns>/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

### Tailnet bağlama + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Ardından gateway'i başlatın (bu loopback olmayan örnek, paylaşılan gizli token
kimlik doğrulaması kullanır):

```bash
openclaw gateway
```

Şunu açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

### Genel internet (Funnel)

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

- Gateway kimlik doğrulaması varsayılan olarak gereklidir (token, parola, trusted-proxy veya etkinleştirildiğinde Tailscale Serve kimlik üst bilgileri).
- Loopback olmayan bağlamalar yine de **gateway kimlik doğrulaması** gerektirir. Pratikte bu, token/parola kimlik doğrulaması veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir ters proxy anlamına gelir.
- Sihirbaz varsayılan olarak paylaşılan gizli kimlik doğrulaması oluşturur ve genellikle bir
  gateway token'ı üretir (loopback üzerinde bile).
- Paylaşılan gizli modda UI, `connect.params.auth.token` veya
  `connect.params.auth.password` gönderir.
- `gateway.tls.enabled: true` olduğunda, yerel pano ve durum yardımcıları
  `https://` pano URL'leri ve `wss://` WebSocket URL'leri oluşturur.
- Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlarda,
  WebSocket kimlik doğrulama denetimi bunun yerine istek üst bilgilerinden karşılanır.
- Loopback olmayan Control UI dağıtımları için `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlayın (tam origin'ler). Bu ayar olmadan gateway başlangıcı varsayılan olarak reddedilir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`,
  Host-header origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik düşüşüdür.
- Serve ile, `gateway.auth.allowTailscale` değeri `true` olduğunda Tailscale kimlik üst bilgileri
  Control UI/WebSocket kimlik doğrulamasını karşılayabilir (token/parola gerekmez).
  HTTP API uç noktaları bu Tailscale kimlik üst bilgilerini kullanmaz; bunun yerine
  gateway'in normal HTTP kimlik doğrulama modunu izler. Açık kimlik bilgileri gerektirmek için
  `gateway.auth.allowTailscale: false` ayarlayın. Bkz.
  [Tailscale](/tr/gateway/tailscale) ve [Güvenlik](/tr/gateway/security). Bu
  tokensız akış, gateway host'una güvenildiğini varsayar.
- `gateway.tailscale.mode: "funnel"`, `gateway.auth.mode: "password"` gerektirir (paylaşılan parola).

## UI'yi derleme

Gateway, statik dosyaları `dist/control-ui` içinden sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```
