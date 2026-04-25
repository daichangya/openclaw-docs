---
read_when:
    - Gösterge paneli kimlik doğrulamasını veya görünürlük modlarını değiştirme
summary: Gateway gösterge paneli (Control UI) erişimi ve kimlik doğrulama
title: Gösterge paneli
x-i18n:
    generated_at: "2026-04-25T14:01:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

Gateway gösterge paneli, varsayılan olarak `/` yolunda sunulan tarayıcı tabanlı Control UI'dir
(`gateway.controlUi.basePath` ile geçersiz kılınabilir).

Hızlı açılış (yerel Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true` ile `https://127.0.0.1:18789/` kullanın ve
  WebSocket uç noktası için `wss://127.0.0.1:18789` kullanın.

Temel başvurular:

- Kullanım ve UI yetenekleri için [Control UI](/tr/web/control-ui).
- Serve/Funnel otomasyonu için [Tailscale](/tr/gateway/tailscale).
- Bağlama modları ve güvenlik notları için [Web yüzeyleri](/tr/web).

Kimlik doğrulama, yapılandırılmış gateway
kimlik doğrulama yolu üzerinden WebSocket handshake sırasında zorunlu kılınır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üst bilgileri

Bkz. [Gateway yapılandırması](/tr/gateway/configuration) içindeki `gateway.auth`.

Güvenlik notu: Control UI bir **yönetici yüzeyidir** (sohbet, yapılandırma, exec onayları).
Bunu herkese açık şekilde yayınlamayın. UI, gösterge paneli URL token'larını mevcut tarayıcı sekmesi oturumu
ve seçili gateway URL'si için sessionStorage içinde tutar ve yüklemeden sonra bunları URL'den kaldırır.
localhost, Tailscale Serve veya SSH tüneli tercih edin.

## Hızlı yol (önerilen)

- Onboarding sonrasında CLI gösterge panelini otomatik açar ve temiz (token içermeyen) bir bağlantı yazdırır.
- İstediğiniz zaman yeniden açın: `openclaw dashboard` (bağlantıyı kopyalar, mümkünse tarayıcıyı açar, headless ise SSH ipucunu gösterir).
- UI paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı veya
  parolayı Control UI ayarlarına yapıştırın.

## Kimlik doğrulama temelleri (yerel ve uzak)

- **Localhost**: `http://127.0.0.1:18789/` adresini açın.
- **Gateway TLS**: `gateway.tls.enabled: true` olduğunda gösterge paneli/durum bağlantıları
  `https://`, Control UI WebSocket bağlantıları ise `wss://` kullanır.
- **Paylaşılan gizli token kaynağı**: `gateway.auth.token` (veya
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` bunu tek seferlik önyükleme için
  URL fragment aracılığıyla geçirebilir ve Control UI bunu localStorage yerine geçerli
  tarayıcı sekmesi oturumu ve seçilen gateway URL'si için sessionStorage içinde tutar.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa, `openclaw dashboard`
  tasarım gereği token içermeyen bir URL yazdırır/kopyalar/açar. Bu, harici olarak
  yönetilen token'ların shell günlüklerinde, pano geçmişinde veya tarayıcı başlatma
  argümanlarında açığa çıkmasını önler.
- `gateway.auth.token` bir SecretRef olarak yapılandırılmışsa ve mevcut shell ortamınızda
  çözümlenmemişse, `openclaw dashboard` yine de token içermeyen bir URL ile
  eyleme dönüştürülebilir kimlik doğrulama kurulum yönergeleri yazdırır.
- **Paylaşılan gizli parola**: yapılandırılmış `gateway.auth.password` değerini (veya
  `OPENCLAW_GATEWAY_PASSWORD`) kullanın. Gösterge paneli parolaları yeniden yüklemeler arasında
  kalıcı olarak saklamaz.
- **Kimlik taşıyan modlar**: `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve,
  kimlik üst bilgileri üzerinden Control UI/WebSocket
  kimlik doğrulamasını karşılayabilir ve döngüsel olmayan kimlik farkındalığına sahip bir reverse proxy,
  `gateway.auth.mode: "trusted-proxy"` durumunda bunu karşılayabilir. Bu modlarda
  gösterge panelinin WebSocket için yapıştırılmış paylaşılan gizli anahtara ihtiyacı yoktur.
- **Localhost değilse**: Tailscale Serve, döngüsel olmayan paylaşılan gizli anahtar bağı, `gateway.auth.mode: "trusted-proxy"` ile
  döngüsel olmayan kimlik farkındalığına sahip reverse proxy veya SSH tüneli kullanın. HTTP API'leri yine de
  siz bilerek özel giriş `gateway.auth.mode: "none"` veya trusted-proxy HTTP kimlik doğrulaması
  çalıştırmadığınız sürece paylaşılan gizli anahtar kimlik doğrulamasını kullanır. Bkz.
  [Web yüzeyleri](/tr/web).

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008 görürseniz

- Gateway'e erişilebildiğinden emin olun (yerel: `openclaw status`; uzak: SSH tüneli `ssh -N -L 18789:127.0.0.1:18789 user@host`, ardından `http://127.0.0.1:18789/` adresini açın).
- `AUTH_TOKEN_MISMATCH` için istemciler, gateway yeniden deneme ipuçları döndürdüğünde önbelleğe alınmış cihaz token'ı ile güvenilir tek bir yeniden deneme yapabilir. Bu önbelleğe alınmış token yeniden denemesi, token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır; açık `deviceToken` / açık `scopes` çağıranları ise istenen kapsam kümesini korur. Bu yeniden denemeden sonra kimlik doğrulama hâlâ başarısız olursa, token kaymasını manuel olarak çözün.
- Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra kayıtlı cihaz token'ı, sonra önyükleme token'ıdır.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız denemeler, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu nedenle ikinci eşzamanlı kötü yeniden deneme zaten `retry later` gösterebilir.
- Token kayması onarım adımları için [Token drift recovery checklist](/tr/cli/devices#token-drift-recovery-checklist) belgesini izleyin.
- Paylaşılan gizli anahtarı gateway host'undan alın veya sağlayın:
  - Token: `openclaw config get gateway.auth.token`
  - Parola: yapılandırılmış `gateway.auth.password` veya
    `OPENCLAW_GATEWAY_PASSWORD` değerini çözümleyin
  - SecretRef tarafından yönetilen token: harici gizli bilgi sağlayıcısını çözümleyin veya
    bu shell ortamında `OPENCLAW_GATEWAY_TOKEN` dışa aktarın, sonra `openclaw dashboard`
    komutunu yeniden çalıştırın
  - Yapılandırılmış paylaşılan gizli anahtar yoksa: `openclaw doctor --generate-gateway-token`
- Gösterge paneli ayarlarında token'ı veya parolayı kimlik doğrulama alanına
  yapıştırın, ardından bağlanın.
- UI dil seçici **Overview -> Gateway Access -> Language** bölümündedir.
  Appearance bölümünün değil, erişim kartının parçasıdır.

## İlgili

- [Control UI](/tr/web/control-ui)
- [WebChat](/tr/web/webchat)
