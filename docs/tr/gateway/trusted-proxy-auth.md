---
read_when:
    - OpenClaw'ı kimlik farkındalığı olan bir proxy arkasında çalıştırma
    - OpenClaw'ın önünde OAuth ile Pomerium, Caddy veya nginx kurma
    - Reverse proxy kurulumlarında WebSocket 1008 yetkisiz hatalarını düzeltme
    - HSTS ve diğer HTTP sertleştirme başlıklarının nerede ayarlanacağına karar verme
summary: Gateway kimlik doğrulamasını güvenilen bir reverse proxy'ye devredin (Pomerium, Caddy, nginx + OAuth)
title: Güvenilen Proxy Kimlik Doğrulaması
x-i18n:
    generated_at: "2026-04-23T09:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Güvenilen Proxy Kimlik Doğrulaması

> ⚠️ **Güvenlik açısından hassas özellik.** Bu kip, kimlik doğrulamayı tamamen reverse proxy'nize devreder. Yanlış yapılandırma Gateway'inizi yetkisiz erişime açabilir. Etkinleştirmeden önce bu sayfayı dikkatlice okuyun.

## Ne Zaman Kullanılmalı

Şu durumlarda `trusted-proxy` kimlik doğrulama kipini kullanın:

- OpenClaw'ı bir **kimlik farkındalığı olan proxy** arkasında çalıştırıyorsunuz (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Proxy'niz tüm kimlik doğrulamayı yapıyor ve kullanıcı kimliğini başlıklar üzerinden iletiyor
- Proxy'nin Gateway'e giden tek yol olduğu bir Kubernetes veya container ortamındasınız
- Tarayıcılar WS yüklerinde token geçiremediği için WebSocket `1008 unauthorized` hataları alıyorsunuz

## Ne Zaman KULLANILMAMALI

- Proxy'niz kullanıcıları kimlik doğrulamıyorsa (yalnızca TLS sonlandırıcı veya yük dengeleyici ise)
- Proxy'yi atlayarak Gateway'e ulaşan herhangi bir yol varsa (firewall açıkları, iç ağ erişimi)
- Proxy'nizin iletilen başlıkları doğru şekilde kaldırdığından/üzerine yazdığından emin değilseniz
- Yalnızca kişisel tek kullanıcılı erişime ihtiyacınız varsa (daha basit kurulum için Tailscale Serve + loopback düşünün)

## Nasıl Çalışır

1. Reverse proxy'niz kullanıcıları kimlik doğrular (OAuth, OIDC, SAML vb.)
2. Proxy, kimliği doğrulanmış kullanıcı kimliğini içeren bir başlık ekler (ör. `x-forwarded-user: nick@example.com`)
3. OpenClaw isteğin **güvenilen bir proxy IP**'sinden geldiğini denetler (`gateway.trustedProxies` içinde yapılandırılmış)
4. OpenClaw kullanıcı kimliğini yapılandırılmış başlıktan çıkarır
5. Her şey doğruysa istek yetkilendirilir

## Control UI Eşleştirme Davranışı

`gateway.auth.mode = "trusted-proxy"` etkin olduğunda ve istek
trusted-proxy denetimlerini geçtiğinde, Control UI WebSocket oturumları cihaz
eşleştirme kimliği olmadan bağlanabilir.

Sonuçlar:

- Bu kipte, Control UI erişimi için eşleştirme artık birincil geçit değildir.
- Reverse proxy kimlik doğrulama ilkeniz ve `allowUsers`, etkin erişim denetimi hâline gelir.
- Gateway girişini yalnızca güvenilen proxy IP'lerine kilitli tutun (`gateway.trustedProxies` + firewall).

## Yapılandırma

```json5
{
  gateway: {
    // Trusted-proxy kimlik doğrulaması, loopback olmayan güvenilen bir proxy kaynağından gelen istekleri bekler
    bind: "lan",

    // KRİTİK: Buraya yalnızca proxy'nizin IP'lerini ekleyin
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Kimliği doğrulanmış kullanıcı kimliğini içeren başlık (zorunlu)
        userHeader: "x-forwarded-user",

        // İsteğe bağlı: MUTLAKA bulunması gereken başlıklar (proxy doğrulaması)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // İsteğe bağlı: belirli kullanıcılarla sınırla (boş = tümüne izin ver)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Önemli çalışma zamanı kuralı:

- Trusted-proxy kimlik doğrulaması loopback kaynaklı istekleri reddeder (`127.0.0.1`, `::1`, loopback CIDR'ları).
- Aynı ana makinedeki loopback reverse proxy'ler trusted-proxy kimlik doğrulamasını karşılamaz.
- Aynı ana makinede loopback proxy kurulumları için bunun yerine token/parola kimlik doğrulaması kullanın veya OpenClaw'ın doğrulayabileceği loopback olmayan güvenilen bir proxy adresi üzerinden yönlendirin.
- Loopback olmayan Control UI dağıtımları yine de açık `gateway.controlUi.allowedOrigins` gerektirir.
- **İletilen başlık kanıtı, loopback yerelliğini geçersiz kılar.** Bir istek loopback üzerinden gelirse ama `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` başlıklarıyla loopback olmayan bir kaynağı gösterirse, bu kanıt loopback yerellik iddiasını geçersiz kılar. İstek; eşleştirme, trusted-proxy kimlik doğrulaması ve Control UI cihaz-kimliği geçitlemesi için uzak olarak değerlendirilir. Bu, aynı ana makinedeki bir loopback proxy'nin iletilen başlık kimliğini trusted-proxy kimlik doğrulamasına aklamasını önler.

### Yapılandırma Başvurusu

| Alan                                        | Zorunlu | Açıklama                                                                    |
| ------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Evet    | Güvenilecek proxy IP adresleri dizisi. Diğer IP'lerden gelen istekler reddedilir. |
| `gateway.auth.mode`                         | Evet    | `"trusted-proxy"` olmalıdır                                                 |
| `gateway.auth.trustedProxy.userHeader`      | Evet    | Kimliği doğrulanmış kullanıcı kimliğini içeren başlık adı                   |
| `gateway.auth.trustedProxy.requiredHeaders` | Hayır   | İsteğin güvenilir sayılması için bulunması gereken ek başlıklar             |
| `gateway.auth.trustedProxy.allowUsers`      | Hayır   | Kullanıcı kimliği izin listesi. Boş olması, kimliği doğrulanmış tüm kullanıcılara izin verileceği anlamına gelir. |

## TLS sonlandırma ve HSTS

Tek bir TLS sonlandırma noktası kullanın ve HSTS'yi orada uygulayın.

### Önerilen desen: proxy TLS sonlandırma

Reverse proxy'niz `https://control.example.com` için HTTPS işliyorsa,
o alan adı için `Strict-Transport-Security` başlığını proxy üzerinde ayarlayın.

- İnternete açık dağıtımlar için iyi uyumludur.
- Sertifika + HTTP sertleştirme ilkesini tek yerde tutar.
- OpenClaw, proxy arkasında loopback HTTP üzerinde kalabilir.

Örnek başlık değeri:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway TLS sonlandırma

OpenClaw HTTPS'yi doğrudan kendisi sunuyorsa (TLS sonlandıran proxy yoksa), şunu ayarlayın:

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

`strictTransportSecurity`, dize başlık değeri veya açıkça devre dışı bırakmak için `false` kabul eder.

### Yaygınlaştırma rehberi

- Trafiği doğrularken önce kısa bir max age ile başlayın (örneğin `max-age=300`).
- Yalnızca güven yüksek olduktan sonra uzun ömürlü değerlere çıkarın (örneğin `max-age=31536000`).
- `includeSubDomains` değerini yalnızca her alt alan adı HTTPS'ye hazırsa ekleyin.
- Preload'u yalnızca tam alan adı kümeniz için preload gereksinimlerini kasıtlı olarak karşılıyorsanız kullanın.
- Yalnızca loopback yerel geliştirme HSTS'den yararlanmaz.

## Proxy Kurulum Örnekleri

### Pomerium

Pomerium, kimliği `x-pomerium-claim-email` içinde (veya diğer claim başlıklarında) ve JWT'yi `x-pomerium-jwt-assertion` içinde geçirir.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium IP'si
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

Pomerium yapılandırma parçacığı:

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

### OAuth ile Caddy

`caddy-security` Plugin'i ile Caddy, kullanıcıları kimlik doğrulayabilir ve kimlik başlıkları geçirebilir.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP'si
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile parçacığı:

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

oauth2-proxy kullanıcıları kimlik doğrular ve kimliği `x-auth-request-email` içinde geçirir.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP'si
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx yapılandırma parçacığı:

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

### Forward Auth ile Traefik

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik container IP'si
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Karışık token yapılandırması

OpenClaw, hem `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) hem de `trusted-proxy` kipi aynı anda etkin olduğunda belirsiz yapılandırmaları reddeder. Karışık token yapılandırmaları, loopback isteklerin sessizce yanlış kimlik doğrulama yolunda kimlik doğrulamasına neden olabilir.

Başlangıçta `mixed_trusted_proxy_token` hatası görürseniz:

- trusted-proxy kipi kullanırken paylaşılan token'ı kaldırın veya
- token tabanlı kimlik doğrulama istiyorsanız `gateway.auth.mode` değerini `"token"` olarak değiştirin.

Loopback trusted-proxy kimlik doğrulaması da fail-closed çalışır: aynı ana makinedeki çağıranlar, sessizce kimlik doğrulanmak yerine yapılandırılmış kimlik başlıklarını güvenilen bir proxy üzerinden sağlamalıdır.

## Operatör kapsamları başlığı

Trusted-proxy kimlik doğrulaması, **kimlik taşıyan** bir HTTP kipidir; bu yüzden çağıranlar
isteğe bağlı olarak operatör kapsamlarını `x-openclaw-scopes` ile bildirebilir.

Örnekler:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Davranış:

- Başlık mevcutsa, OpenClaw bildirilen kapsam kümesini uygular.
- Başlık mevcut ama boşsa, istek **hiç** operatör kapsamı bildirmez.
- Başlık yoksa, normal kimlik taşıyan HTTP API'leri standart varsayılan operatör kapsam kümesine geri döner.
- Gateway-auth **Plugin HTTP rotaları** varsayılan olarak daha dardır: `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` olur.
- Tarayıcı kaynaklı HTTP istekleri, trusted-proxy kimlik doğrulaması başarılı olduktan sonra bile yine de `gateway.controlUi.allowedOrigins` (veya kasıtlı Host-header geri dönüş kipini) geçmek zorundadır.

Pratik kural:

- Bir trusted-proxy isteğinin varsayılanlardan daha dar olmasını istediğinizde veya bir gateway-auth Plugin rotasının yazma kapsamından daha güçlü bir şeye ihtiyaç duyduğunda `x-openclaw-scopes` başlığını açıkça gönderin.

## Güvenlik Kontrol Listesi

Trusted-proxy kimlik doğrulamasını etkinleştirmeden önce şunları doğrulayın:

- [ ] **Proxy tek yol**: Gateway portu, proxy'niz dışında her şeye karşı firewall ile kapalı
- [ ] **trustedProxies minimal**: tüm alt ağlar değil, yalnızca gerçek proxy IP'leriniz
- [ ] **Loopback proxy kaynağı yok**: trusted-proxy kimlik doğrulaması loopback kaynaklı isteklerde fail-closed olur
- [ ] **Proxy başlıkları kaldırıyor**: proxy'niz istemcilerden gelen `x-forwarded-*` başlıklarının üzerine yazar (eklemez)
- [ ] **TLS sonlandırma**: proxy'niz TLS'yi işler; kullanıcılar HTTPS üzerinden bağlanır
- [ ] **allowedOrigins açık**: loopback olmayan Control UI, açık `gateway.controlUi.allowedOrigins` kullanır
- [ ] **allowUsers ayarlı** (önerilir): kimliği doğrulanmış herkese izin vermek yerine bilinen kullanıcılarla sınırlandırın
- [ ] **Karışık token yapılandırması yok**: hem `gateway.auth.token` hem de `gateway.auth.mode: "trusted-proxy"` ayarlamayın

## Güvenlik Denetimi

`openclaw security audit`, trusted-proxy kimlik doğrulamasını **critical** önem dereceli bir bulguyla işaretler. Bu kasıtlıdır — güvenliği proxy kurulumunuza devrettiğinizi hatırlatır.

Denetim şunları kontrol eder:

- Temel `gateway.trusted_proxy_auth` warning/critical hatırlatıcısı
- Eksik `trustedProxies` yapılandırması
- Eksik `userHeader` yapılandırması
- Boş `allowUsers` (kimliği doğrulanmış herhangi bir kullanıcıya izin verir)
- Dışa açık Control UI yüzeylerinde joker veya eksik tarayıcı-kaynağı ilkesi

## Sorun giderme

### "trusted_proxy_untrusted_source"

İstek, `gateway.trustedProxies` içindeki bir IP'den gelmedi. Şunları kontrol edin:

- Proxy IP'si doğru mu? (Docker container IP'leri değişebilir)
- Proxy'nizin önünde bir yük dengeleyici var mı?
- Gerçek IP'leri bulmak için `docker inspect` veya `kubectl get pods -o wide` kullanın

### "trusted_proxy_loopback_source"

OpenClaw bir loopback kaynaklı trusted-proxy isteğini reddetti.

Şunları kontrol edin:

- Proxy `127.0.0.1` / `::1` üzerinden mi bağlanıyor?
- Trusted-proxy kimlik doğrulamasını aynı ana makinede bir loopback reverse proxy ile kullanmaya mı çalışıyorsunuz?

Düzeltme:

- Aynı ana makinede loopback proxy kurulumları için token/parola kimlik doğrulaması kullanın veya
- Loopback olmayan güvenilen bir proxy adresi üzerinden yönlendirin ve bu IP'yi `gateway.trustedProxies` içinde tutun.

### "trusted_proxy_user_missing"

Kullanıcı başlığı boştu veya eksikti. Şunları kontrol edin:

- Proxy'niz kimlik başlıklarını iletecek şekilde yapılandırılmış mı?
- Başlık adı doğru mu? (büyük/küçük harf duyarsızdır, ama yazım önemlidir)
- Kullanıcının kimliği gerçekten proxy'de doğrulanmış mı?

### "trusted*proxy_missing_header*\*"

Gerekli bir başlık mevcut değildi. Şunları kontrol edin:

- Proxy yapılandırmanızda bu belirli başlıklar
- Başlıkların zincirin bir yerinde kaldırılıp kaldırılmadığı

### "trusted_proxy_user_not_allowed"

Kullanıcının kimliği doğrulanmış ama `allowUsers` içinde değil. Ya ekleyin ya da izin listesini kaldırın.

### "trusted_proxy_origin_not_allowed"

Trusted-proxy kimlik doğrulaması başarılı oldu, ancak tarayıcı `Origin` başlığı Control UI kaynak denetimlerini geçemedi.

Şunları kontrol edin:

- `gateway.controlUi.allowedOrigins`, tam tarayıcı kaynağını içeriyor mu
- Bilerek herkese izin verme davranışı istemiyorsanız joker kaynaklara güvenmiyorsunuz
- Host-header geri dönüş kipini bilerek kullanıyorsanız, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bilinçli olarak ayarlanmış

### WebSocket Hâlâ Başarısız Oluyor

Proxy'nizin şunları yaptığından emin olun:

- WebSocket yükseltmelerini destekliyor (`Upgrade: websocket`, `Connection: upgrade`)
- Kimlik başlıklarını WebSocket yükseltme isteklerinde de geçiriyor (yalnızca HTTP'de değil)
- WebSocket bağlantıları için ayrı bir kimlik doğrulama yolu kullanmıyor

## Token Kimlik Doğrulamasından Geçiş

Token kimlik doğrulamasından trusted-proxy'ye geçiyorsanız:

1. Proxy'nizi kullanıcıları kimlik doğrulayacak ve başlıkları geçirecek şekilde yapılandırın
2. Proxy kurulumunu bağımsız olarak test edin (başlıklarla `curl`)
3. OpenClaw yapılandırmasını trusted-proxy kimlik doğrulamasıyla güncelleyin
4. Gateway'i yeniden başlatın
5. Control UI üzerinden WebSocket bağlantılarını test edin
6. `openclaw security audit` çalıştırın ve bulguları gözden geçirin

## İlgili

- [Güvenlik](/tr/gateway/security) — tam güvenlik rehberi
- [Yapılandırma](/tr/gateway/configuration) — yapılandırma başvurusu
- [Uzak Erişim](/tr/gateway/remote) — diğer uzak erişim desenleri
- [Tailscale](/tr/gateway/tailscale) — yalnızca tailnet erişimi için daha basit alternatif
