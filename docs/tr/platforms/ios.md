---
read_when:
    - iOS Node'unu eşleştirme veya yeniden bağlama
    - iOS uygulamasını kaynak koddan çalıştırma
    - Gateway keşfini veya canvas komutlarını ayıklama
summary: 'iOS Node uygulaması: Gateway''e bağlanma, eşleştirme, canvas ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-04-25T13:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Kullanılabilirlik: dahili önizleme. iOS uygulaması henüz herkese açık olarak dağıtılmıyor.

## Ne yapar

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Node yeteneklerini açığa çıkarır: Canvas, Screen anlık görüntüsü, Camera yakalama, Konum, Talk modu, Voice wake.
- `node.invoke` komutlarını alır ve node durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Aynı LAN üzerinde Bonjour ile, **veya**
  - Unicast DNS-SD üzerinden tailnet ile (örnek alan adı: `openclaw.internal.`), **veya**
  - El ile host/port (fallback).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Settings'i açın ve keşfedilen bir gateway seçin (veya Manual Host seçeneğini etkinleştirip host/port girin).

3. Eşleştirme isteğini gateway host'unda onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

İsteğe bağlı: iOS node her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa,
açık CIDR'ler veya tam IP'lerle ilk node otomatik onayını etkinleştirebilirsiniz:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirmesi için geçerlidir.
Operator/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, meta veri veya
açık anahtar değişikliği yine manuel onay gerektirir.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi build'ler için relay destekli push

Resmi dağıtılan iOS build'leri ham APNs token'ını gateway'e yayınlamak yerine harici push relay kullanır.

Gateway tarafı gereksinimi:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Akışın çalışma şekli:

- iOS uygulaması App Attest ve uygulama makbuzu kullanarak relay'e kaydolur.
- Relay, opak bir relay handle ile kayıt kapsamlı bir gönderim yetkisi döndürür.
- iOS uygulaması eşleştirilmiş gateway kimliğini alır ve bunu relay kaydına dahil eder; böylece relay destekli kayıt o belirli gateway'e devredilir.
- Uygulama bu relay destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için bu depolanan relay handle'ı kullanır.
- Gateway relay base URL'si, resmi/TestFlight iOS build'ine gömülü relay URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir gateway'e veya farklı relay base URL'sine sahip bir build'e bağlanırsa, eski bağı yeniden kullanmak yerine relay kaydını yeniler.

Bu yol için gateway'in **gerek duymadığı** şeyler:

- Dağıtım genelinde relay token yok.
- Resmi/TestFlight relay destekli gönderimler için doğrudan APNs anahtarı yok.

Beklenen operatör akışı:

1. Resmi/TestFlight iOS build'ini kurun.
2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` ayarlayın.
3. Uygulamayı gateway ile eşleştirin ve bağlantıyı tamamlamasına izin verin.
4. Uygulama, APNs token'ına sahip olduktan, operator oturumu bağlandıktan ve relay kaydı başarılı olduktan sonra `push.apns.register` yayınını otomatik olarak yapar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri depolanan relay destekli kaydı kullanabilir.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, gateway için geçici bir ortam değişkeni geçersiz kılması olarak hâlâ çalışır.

## Kimlik doğrulama ve güven akışı

Relay, resmi iOS build'leri için doğrudan gateway üzerinde APNs'nin sağlayamayacağı iki kısıtı uygulamak için vardır:

- Hosted relay'i yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS build'leri kullanabilir.
- Bir gateway, relay destekli push'ları yalnızca o belirli gateway ile eşleştirilen iOS cihazlarına gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışı üzerinden gateway ile eşleştirilir.
   - Bu, uygulamaya kimliği doğrulanmış bir node oturumu ve kimliği doğrulanmış bir operator oturumu verir.
   - Operator oturumu, `gateway.identity.get` çağrısı için kullanılır.

2. `iOS app -> relay`
   - Uygulama relay kayıt uç noktalarını HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtı ile uygulama makbuzunu içerir.
   - Relay, bundle ID'yi, App Attest kanıtını ve Apple makbuzunu doğrular ve
     resmi/üretim dağıtım yolunu gerektirir.
   - Yerel Xcode/dev build'lerinin hosted relay'i kullanmasını engelleyen şey budur. Yerel bir build
     imzalı olabilir, ancak relay'in beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Relay kaydından önce uygulama, eşleştirilmiş gateway kimliğini
     `gateway.identity.get` üzerinden alır.
   - Uygulama bu gateway kimliğini relay kayıt yüküne dahil eder.
   - Relay, bu gateway kimliğine devredilmiş bir relay handle ve kayıt kapsamlı gönderim yetkisi döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` içinden gelen relay handle ve gönderim yetkisini depolar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri sırasında gateway
     gönderim isteğini kendi cihaz kimliğiyle imzalar.
   - Relay, hem depolanan gönderim yetkisini hem de gateway imzasını, kayıt sırasındaki devredilmiş
     gateway kimliğine karşı doğrular.
   - Başka bir gateway, handle'ı bir şekilde ele geçirse bile bu depolanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Relay, resmi build için üretim APNs kimlik bilgilerine ve ham APNs token'ına sahiptir.
   - Gateway, relay destekli resmi build'ler için ham APNs token'ını asla depolamaz.
   - Relay, eşleştirilmiş gateway adına son push'ı APNs'ye gönderir.

Bu tasarım neden oluşturuldu:

- Üretim APNs kimlik bilgilerini kullanıcı gateway'lerinden uzak tutmak için.
- Ham resmi build APNs token'larını gateway üzerinde depolamaktan kaçınmak için.
- Hosted relay kullanımına yalnızca resmi/TestFlight OpenClaw build'leri için izin vermek için.
- Bir gateway'in, farklı bir gateway'e ait iOS cihazlarına uyandırma push'ları göndermesini önlemek için.

Yerel/el ile build'ler doğrudan APNs üzerinde kalır. Bu build'leri relay olmadan test ediyorsanız,
gateway'in yine de doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar gateway host çalışma zamanı ortam değişkenleridir, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca
`ASC_KEY_ID` ve `ASC_ISSUER_ID` gibi App Store Connect / TestFlight kimlik doğrulamasını depolar; yerel iOS build'leri için
doğrudan APNs teslimatını yapılandırmaz.

Önerilen gateway host depolaması:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` dosyasını commit etmeyin ve repo checkout'u altına koymayın.

## Keşif yolları

### Bonjour (LAN)

iOS uygulaması `_openclaw-gw._tcp` hizmetini `local.` üzerinde ve yapılandırılmışsa aynı
geniş alan DNS-SD keşif alanında tarar. Aynı LAN üzerindeki gateway'ler `local.` üzerinden otomatik görünür;
ağlar arası keşif, beacon türünü değiştirmeden yapılandırılmış geniş alan alanını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse, bir unicast DNS-SD bölgesi kullanın (bir alan seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için bkz. [Bonjour](/tr/gateway/bonjour).

### El ile host/port

Settings içinde **Manual Host** seçeneğini etkinleştirin ve gateway host + port girin (varsayılan `18789`).

## Canvas + A2UI

iOS node bir WKWebView canvas işler. Bunu sürmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas host'u `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` yollarını sunar.
- Gateway HTTP sunucusundan sunulur (gateway.port ile aynı port, varsayılan `18789`).
- iOS node, bir canvas host URL'si duyurulduğunda bağlanırken otomatik olarak A2UI'ye gider.
- Yerleşik iskeleye dönmek için `canvas.navigate` ve `{"url":""}` kullanın.

### Canvas eval / anlık görüntü

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk modu

- Voice wake ve Talk modu Settings içinde kullanılabilir.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini en iyi çaba olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/camera/screen komutları bunu gerektirir).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway bir canvas host URL'si duyurmadı; [Gateway configuration](/tr/gateway/configuration) içindeki `canvasHost` değerini denetleyin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` çalıştırın ve elle onaylayın.
- Yeniden kurulumdan sonra yeniden bağlanma başarısız oluyor: Keychain eşleştirme token'ı temizlendi; node'u yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
