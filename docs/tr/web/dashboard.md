---
read_when:
    - Dashboard kimlik doğrulamasını veya erişim modlarını değiştirme
summary: Gateway dashboard erişimi (Control UI) ve kimlik doğrulama
title: Dashboard
x-i18n:
    generated_at: "2026-04-23T09:13:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

Gateway dashboard, varsayılan olarak `/` altında sunulan tarayıcı Control UI'dir
(`gateway.controlUi.basePath` ile geçersiz kılınabilir).

Hızlı açılış (yerel Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Temel başvurular:

- Kullanım ve UI yetenekleri için [Control UI](/tr/web/control-ui).
- Serve/Funnel otomasyonu için [Tailscale](/tr/gateway/tailscale).
- Bind modları ve güvenlik notları için [Web surfaces](/tr/web).

Kimlik doğrulama, yapılandırılmış Gateway
kimlik doğrulama yolu üzerinden WebSocket el sıkışmasında zorunlu tutulur:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üstbilgileri

[Gateway yapılandırması](/tr/gateway/configuration) içinde `gateway.auth` bölümüne bakın.

Güvenlik notu: Control UI bir **yönetici yüzeyidir** (sohbet, yapılandırma, exec onayları).
Bunu herkese açık şekilde yayımlamayın. UI, dashboard URL token'larını geçerli tarayıcı sekmesi oturumu ve seçilen Gateway URL'si için sessionStorage içinde tutar ve yüklendikten sonra bunları URL'den çıkarır.
localhost, Tailscale Serve veya SSH tüneli tercih edin.

## Hızlı yol (önerilen)

- Onboarding sonrası CLI dashboard'u otomatik açar ve temiz (tokensız) bir bağlantı yazdırır.
- İstediğiniz zaman yeniden açın: `openclaw dashboard` (bağlantıyı kopyalar, mümkünse tarayıcıyı açar, headless ise SSH ipucu gösterir).
- UI paylaşılan sır kimlik doğrulaması isterse, yapılandırılmış token'ı veya
  parolayı Control UI ayarlarına yapıştırın.

## Kimlik doğrulama temelleri (yerel vs uzak)

- **Localhost**: `http://127.0.0.1:18789/` adresini açın.
- **Paylaşılan sır token kaynağı**: `gateway.auth.token` (veya
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` bunu tek seferlik önyükleme için URL fragment üzerinden geçirebilir ve Control UI bunu localStorage yerine geçerli tarayıcı sekmesi oturumu ve seçilen Gateway URL'si için sessionStorage içinde tutar.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa, `openclaw dashboard`
  tasarım gereği tokensız bir URL yazdırır/kopyalar/açar. Bu, harici olarak yönetilen token'ların shell günlüklerinde, pano geçmişinde veya tarayıcı başlatma bağımsız değişkenlerinde açığa çıkmasını önler.
- `gateway.auth.token` bir SecretRef olarak yapılandırılmışsa ve geçerli
  shell'inizde çözümlenmemişse, `openclaw dashboard` yine de tokensız bir URL ile
  uygulanabilir kimlik doğrulama kurulum rehberini yazdırır.
- **Paylaşılan sır parolası**: yapılandırılmış `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_PASSWORD`) kullanın. Dashboard parolaları yeniden yüklemeler arasında kalıcı tutmaz.
- **Kimlik taşıyan modlar**: `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve,
  Control UI/WebSocket kimlik doğrulamasını kimlik üstbilgileriyle karşılayabilir; loopback dışı kimlik farkındalığı olan bir reverse proxy de
  `gateway.auth.mode: "trusted-proxy"` ile bunu karşılayabilir. Bu modlarda dashboard'un
  WebSocket için yapıştırılmış paylaşılan sır kullanmasına gerek yoktur.
- **Localhost değilse**: Tailscale Serve, loopback dışı paylaşılan sır bind'i,
  `gateway.auth.mode: "trusted-proxy"` ile loopback dışı kimlik farkındalığı olan bir reverse proxy
  veya bir SSH tüneli kullanın. HTTP API'leri, özel olarak private-ingress
  `gateway.auth.mode: "none"` veya trusted-proxy HTTP kimlik doğrulaması çalıştırmadığınız sürece yine paylaşılan sır kimlik doğrulamasını kullanır. Bkz.
  [Web surfaces](/tr/web).

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008 görürseniz

- Gateway'in erişilebilir olduğundan emin olun (yerel: `openclaw status`; uzak: SSH tüneli `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` açın).
- `AUTH_TOKEN_MISMATCH` için istemciler, Gateway yeniden deneme ipuçları döndürdüğünde önbelleğe alınmış bir cihaz token'ı ile güvenilir bir yeniden deneme yapabilir. Bu önbelleğe alınmış token yeniden denemesi, token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır; açık `deviceToken` / açık `scopes` çağıranlar ise istenen kapsam kümesini korur. Bu yeniden denemeden sonra da kimlik doğrulama başarısız olursa token kaymasını elle çözün.
- Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği sırayla açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz token'ı, ardından önyükleme token'ıdır.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız denemeler failed-auth sınırlayıcı bunları kaydetmeden önce serileştirilir; bu nedenle ikinci eşzamanlı kötü yeniden deneme şimdiden `retry later` gösterebilir.
- Token kayması onarım adımları için [Token drift recovery checklist](/tr/cli/devices#token-drift-recovery-checklist) bölümünü izleyin.
- Paylaşılan sırrı Gateway host'undan alın veya sağlayın:
  - Token: `openclaw config get gateway.auth.token`
  - Parola: yapılandırılmış `gateway.auth.password` veya
    `OPENCLAW_GATEWAY_PASSWORD` değerini çözümleyin
  - SecretRef tarafından yönetilen token: harici secret provider'ı çözümleyin veya
    bu shell içinde `OPENCLAW_GATEWAY_TOKEN` dışa aktarın, ardından `openclaw dashboard`
    komutunu yeniden çalıştırın
  - Yapılandırılmış paylaşılan sır yoksa: `openclaw doctor --generate-gateway-token`
- Dashboard ayarlarında token veya parolayı kimlik doğrulama alanına yapıştırın,
  ardından bağlanın.
- UI dil seçici **Overview -> Gateway Access -> Language** altında bulunur.
  Appearance bölümünün değil, erişim kartının parçasıdır.
