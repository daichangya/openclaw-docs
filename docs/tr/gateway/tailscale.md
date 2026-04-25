---
read_when:
    - Gateway Control UI'yi localhost dışına açma
    - tailnet veya genel pano erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:49:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw, Gateway panosu ve WebSocket portu için Tailscale **Serve** (tailnet) veya **Funnel** (genel) yapılandırmasını otomatik olarak yapabilir. Bu, Gateway'i loopback'e bağlı tutarken Tailscale HTTPS, yönlendirme ve (Serve için) kimlik başlıkları sağlar.

## Modlar

- `serve`: `tailscale serve` aracılığıyla yalnızca tailnet'e açık Serve. gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` aracılığıyla genel HTTPS. OpenClaw paylaşılan parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

## Kimlik doğrulama

El sıkışmayı denetlemek için `gateway.auth.mode` ayarlayın:

- `none` (yalnızca özel giriş)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlıysa varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya yapılandırma aracılığıyla paylaşılan gizli değer)
- `trusted-proxy` (kimlik farkındalıklı ters proxy; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` ve `gateway.auth.allowTailscale` değeri `true` olduğunda,
Control UI/WebSocket kimlik doğrulaması, token/parola sağlamadan Tailscale kimlik başlıklarını
(`tailscale-user-login`) kullanabilir. OpenClaw, kabul etmeden önce
yerel Tailscale daemon'ı (`tailscale whois`) aracılığıyla `x-forwarded-for` adresini çözümler ve
başlıkla eşleştirerek kimliği doğrular.
OpenClaw bir isteği yalnızca loopback üzerinden
Tailscale’in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host`
başlıklarıyla geldiğinde Serve olarak değerlendirir.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`)
Tailscale kimlik başlığı kimlik doğrulamasını **kullanmaz**. Bunlar yine gateway'in
normal HTTP kimlik doğrulama modunu izler: varsayılan olarak paylaşılan gizli kimlik doğrulaması,
veya kasıtlı olarak yapılandırılmış bir trusted-proxy / özel giriş `none` kurulumu.
Bu tokensız akış, gateway host'unun güvenilir olduğunu varsayar. Aynı host üzerinde
güvenilmeyen yerel kod çalışabiliyorsa `gateway.auth.allowTailscale` değerini devre dışı bırakın ve
bunun yerine token/parola kimlik doğrulaması isteyin.
Açık paylaşılan gizli kimlik bilgileri zorunlu kılmak için `gateway.auth.allowTailscale: false`
ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

## Yapılandırma örnekleri

### Yalnızca tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Açın: `https://<magicdns>/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

### Yalnızca tailnet (Tailnet IP'ye bağlan)

Gateway'in doğrudan Tailnet IP üzerinde dinlemesini istiyorsanız bunu kullanın (Serve/Funnel yok).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Başka bir Tailnet cihazından bağlanın:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Not: loopback (`http://127.0.0.1:18789`) bu modda **çalışmaz**.

### Genel internet (Funnel + paylaşılan parola)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Parolayı diske kaydetmek yerine `OPENCLAW_GATEWAY_PASSWORD` tercih edin.

## CLI örnekleri

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notlar

- Tailscale Serve/Funnel için `tailscale` CLI'nin kurulu ve oturum açılmış olması gerekir.
- `tailscale.mode: "funnel"`, genel erişimi önlemek için kimlik doğrulama modu `password` değilse başlatmayı reddeder.
- OpenClaw'ın kapanışta `tailscale serve`
  veya `tailscale funnel` yapılandırmasını geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarlayın.
- `gateway.bind: "tailnet"` doğrudan Tailnet bağlamasıdır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback'i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway control UI + WS**'yi açığa çıkarır. Node'lar
  aynı Gateway WS uç noktası üzerinden bağlandığı için Serve, node erişimi için de çalışabilir.

## Browser denetimi (uzak Gateway + yerel browser)

Gateway'i bir makinede çalıştırıp browser'ı başka bir makinede sürmek istiyorsanız,
browser makinesinde bir **node host** çalıştırın ve ikisini de aynı tailnet üzerinde tutun.
Gateway browser eylemlerini node'a proxy'ler; ayrı bir denetim sunucusu veya Serve URL'si gerekmez.

Browser denetimi için Funnel kullanmaktan kaçının; node eşleştirmesini operatör erişimi gibi değerlendirin.

## Tailscale ön koşulları + sınırlar

- Serve, tailnet'iniz için HTTPS'in etkin olmasını gerektirir; eksikse CLI istem gösterir.
- Serve, Tailscale kimlik başlıkları ekler; Funnel eklemez.
- Funnel için Tailscale v1.38.3+, MagicDNS, etkin HTTPS ve bir funnel node niteliği gerekir.
- Funnel TLS üzerinden yalnızca `443`, `8443` ve `10000` portlarını destekler.
- macOS üzerinde Funnel, açık kaynaklı Tailscale uygulama varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakış: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakış: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzak erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik doğrulama](/tr/gateway/authentication)
