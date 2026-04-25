---
read_when:
    - Zalo özellikleri veya Webhook'lar üzerinde çalışma
summary: Zalo bot desteğinin durumu, yetenekleri ve yapılandırması
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Durum: deneysel. DM'ler desteklenir. Aşağıdaki [Yetenekler](#capabilities) bölümü mevcut Marketplace botu davranışını yansıtır.

## Paketlenmiş Plugin

Zalo, mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal paketlenmiş
derlemeler ayrı bir kurulum gerektirmez.

Eski bir derlemeyi veya Zalo'yu dışlayan özel bir kurulumu kullanıyorsanız, bunu
elle kurun:

- CLI ile kurun: `openclaw plugins install @openclaw/zalo`
- Veya kaynak checkout içinden: `openclaw plugins install ./path/to/local/zalo-plugin`
- Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Zalo Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten paketler.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Token'ı ayarlayın:
   - Ortam değişkeni: `ZALO_BOT_TOKEN=...`
   - Veya yapılandırma: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).
4. DM erişimi varsayılan olarak eşleştirmedir; ilk temasta eşleştirme kodunu onaylayın.

Minimal yapılandırma:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Nedir

Zalo, Vietnam odaklı bir mesajlaşma uygulamasıdır; Bot API'si Gateway'in 1:1 konuşmalar için bir bot çalıştırmasına olanak tanır.
Yanıtların deterministik olarak Zalo'ya geri yönlendirilmesini istediğiniz destek veya bildirim senaryoları için uygundur.

Bu sayfa, **Zalo Bot Creator / Marketplace botları** için mevcut OpenClaw davranışını yansıtır.
**Zalo Official Account (OA) botları** farklı bir Zalo ürün yüzeyidir ve farklı davranabilir.

- Gateway'in sahip olduğu bir Zalo Bot API kanalı.
- Deterministik yönlendirme: yanıtlar Zalo'ya geri gider; model kanalları asla seçmez.
- DM'ler ajanın ana oturumunu paylaşır.
- Aşağıdaki [Yetenekler](#capabilities) bölümü mevcut Marketplace botu desteğini gösterir.

## Kurulum (hızlı yol)

### 1) Bir bot token'ı oluşturun (Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) adresine gidin ve oturum açın.
2. Yeni bir bot oluşturun ve ayarlarını yapılandırın.
3. Tam bot token'ını kopyalayın (genellikle `numeric_id:secret`). Marketplace botları için kullanılabilir çalışma zamanı token'ı, oluşturma sonrasında botun hoş geldiniz mesajında görünebilir.

### 2) Token'ı yapılandırın (ortam değişkeni veya yapılandırma)

Örnek:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Daha sonra grup desteğinin mevcut olduğu bir Zalo bot yüzeyine geçerseniz, `groupPolicy` ve `groupAllowFrom` gibi gruba özgü yapılandırmaları açıkça ekleyebilirsiniz. Mevcut Marketplace botu davranışı için [Yetenekler](#capabilities) bölümüne bakın.

Ortam değişkeni seçeneği: `ZALO_BOT_TOKEN=...` (yalnızca varsayılan hesap için çalışır).

Çoklu hesap desteği: hesap başına token ve isteğe bağlı `name` ile `channels.zalo.accounts` kullanın.

3. Gateway'i yeniden başlatın. Zalo, bir token çözümlendiğinde başlar (ortam değişkeni veya yapılandırma).
4. DM erişimi varsayılan olarak eşleştirmedir. Botla ilk temas kurulduğunda kodu onaylayın.

## Nasıl çalışır (davranış)

- Gelen mesajlar, medya yer tutucularıyla paylaşılan kanal zarfına normalize edilir.
- Yanıtlar her zaman aynı Zalo sohbetine geri yönlendirilir.
- Varsayılan olarak long-polling; `channels.zalo.webhookUrl` ile Webhook modu kullanılabilir.

## Sınırlar

- Giden metin 2000 karaktere bölünür (Zalo API sınırı).
- Medya indirme/yükleme işlemleri `channels.zalo.mediaMaxMb` ile sınırlandırılır (varsayılan 5).
- 2000 karakter sınırı, akışı daha az kullanışlı hâle getirdiği için akış varsayılan olarak engellenir.

## Erişim denetimi (DM'ler)

### DM erişimi

- Varsayılan: `channels.zalo.dmPolicy = "pairing"`. Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Onaylamak için:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Eşleştirme varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- `channels.zalo.allowFrom`, sayısal kullanıcı kimliklerini kabul eder (kullanıcı adı araması yoktur).

## Erişim denetimi (Gruplar)

**Zalo Bot Creator / Marketplace botları** için grup desteği pratikte mevcut değildi, çünkü bot bir gruba hiç eklenemiyordu.

Bu, aşağıdaki grupla ilgili yapılandırma anahtarlarının şemada bulunduğu ancak Marketplace botları için kullanılamadığı anlamına gelir:

- `channels.zalo.groupPolicy`, grup gelen işleme davranışını kontrol eder: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom`, gruplarda hangi gönderici kimliklerinin botu tetikleyebileceğini sınırlar.
- `groupAllowFrom` ayarlanmamışsa, Zalo gönderici denetimleri için `allowFrom` değerine geri döner.
- Çalışma zamanı notu: `channels.zalo` tamamen yoksa, çalışma zamanı güvenlik için yine `groupPolicy="allowlist"` değerine geri döner.

Grup erişimi bot yüzeyinizde mevcut olduğunda grup politikası değerleri şunlardır:

- `groupPolicy: "disabled"` — tüm grup mesajlarını engeller.
- `groupPolicy: "open"` — herhangi bir grup üyesine izin verir (bahsetme kapılı).
- `groupPolicy: "allowlist"` — varsayılan olarak kapalıdır; yalnızca izin verilen göndericiler kabul edilir.

Farklı bir Zalo bot ürün yüzeyi kullanıyorsanız ve çalışan grup davranışını doğruladıysanız, bunun Marketplace botu akışıyla eşleştiğini varsaymak yerine bunu ayrıca belgeleyin.

## Long-polling ve webhook

- Varsayılan: long-polling (genel bir URL gerekmez).
- Webhook modu: `channels.zalo.webhookUrl` ve `channels.zalo.webhookSecret` ayarlayın.
  - Webhook secret 8-256 karakter olmalıdır.
  - Webhook URL HTTPS kullanmalıdır.
  - Zalo, doğrulama için olayları `X-Bot-Api-Secret-Token` başlığıyla gönderir.
  - Gateway HTTP, Webhook isteklerini `channels.zalo.webhookPath` adresinde işler (varsayılan olarak Webhook URL yoludur).
  - İstekler `Content-Type: application/json` (veya `+json` medya türleri) kullanmalıdır.
  - Yinelenen olaylar (`event_name + message_id`) kısa bir tekrar penceresi boyunca yok sayılır.
  - Ani trafik artışı yol/kaynak başına hız sınırına tabidir ve HTTP 429 döndürebilir.

**Not:** Zalo API belgelerine göre getUpdates (polling) ve Webhook hesap başına birbirini dışlar.

## Desteklenen mesaj türleri

Hızlı bir destek özeti için [Yetenekler](#capabilities) bölümüne bakın. Aşağıdaki notlar, davranışın ek bağlam gerektirdiği yerlere ayrıntı ekler.

- **Metin mesajları**: 2000 karakter parçalamayla tam destek.
- **Metin içindeki düz URL'ler**: Normal metin girdisi gibi davranır.
- **Bağlantı önizlemeleri / zengin bağlantı kartları**: Marketplace botu durumu için [Yetenekler](#capabilities) bölümüne bakın; güvenilir şekilde yanıtı tetiklemediler.
- **Görsel mesajları**: Marketplace botu durumu için [Yetenekler](#capabilities) bölümüne bakın; gelen görsel işleme güvenilir değildi (nihai bir yanıt olmadan yazıyor göstergesi).
- **Sticker'lar**: Marketplace botu durumu için [Yetenekler](#capabilities) bölümüne bakın.
- **Sesli notlar / ses dosyaları / video / genel dosya ekleri**: Marketplace botu durumu için [Yetenekler](#capabilities) bölümüne bakın.
- **Desteklenmeyen türler**: Günlüğe kaydedilir (örneğin, korumalı kullanıcılardan gelen mesajlar).

## Yetenekler

Bu tablo, OpenClaw içindeki mevcut **Zalo Bot Creator / Marketplace botu** davranışını özetler.

| Özellik                     | Durum                                   |
| --------------------------- | --------------------------------------- |
| Doğrudan mesajlar           | ✅ Destekleniyor                        |
| Gruplar                     | ❌ Marketplace botları için mevcut değil |
| Medya (gelen görseller)     | ⚠️ Sınırlı / ortamınızda doğrulayın     |
| Medya (giden görseller)     | ⚠️ Marketplace botları için yeniden test edilmedi |
| Metin içindeki düz URL'ler  | ✅ Destekleniyor                        |
| Bağlantı önizlemeleri       | ⚠️ Marketplace botları için güvenilir değil |
| Tepkiler                    | ❌ Desteklenmiyor                       |
| Sticker'lar                 | ⚠️ Marketplace botları için ajan yanıtı yok |
| Sesli notlar / ses / video  | ⚠️ Marketplace botları için ajan yanıtı yok |
| Dosya ekleri                | ⚠️ Marketplace botları için ajan yanıtı yok |
| İş parçacıkları             | ❌ Desteklenmiyor                       |
| Anketler                    | ❌ Desteklenmiyor                       |
| Yerel komutlar              | ❌ Desteklenmiyor                       |
| Akış                        | ⚠️ Engellenmiş (2000 karakter sınırı)   |

## Teslim hedefleri (CLI/cron)

- Hedef olarak bir sohbet kimliği kullanın.
- Örnek: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Sorun giderme

**Bot yanıt vermiyor:**

- Token'ın geçerli olduğunu kontrol edin: `openclaw channels status --probe`
- Göndericinin onaylandığını doğrulayın (eşleştirme veya allowFrom)
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`

**Webhook olay almıyor:**

- Webhook URL'nin HTTPS kullandığından emin olun
- Secret token'ın 8-256 karakter olduğunu doğrulayın
- Gateway HTTP uç noktasına yapılandırılan yolda erişilebildiğini doğrulayın
- getUpdates polling'in çalışmadığını kontrol edin (birbirini dışlar)

## Yapılandırma başvurusu (Zalo)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Düz üst düzey anahtarlar (`channels.zalo.botToken`, `channels.zalo.dmPolicy` ve benzerleri) eski tek hesaplı kısayoldur. Yeni yapılandırmalarda `channels.zalo.accounts.<id>.*` tercih edin. Her iki biçim de şemada bulunduğu için burada hâlâ belgelenmiştir.

Sağlayıcı seçenekleri:

- `channels.zalo.enabled`: kanal başlangıcını etkinleştir/devre dışı bırak.
- `channels.zalo.botToken`: Zalo Bot Platform'dan alınan bot token'ı.
- `channels.zalo.tokenFile`: token'ı normal bir dosya yolundan oku. Symlink'ler reddedilir.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.zalo.allowFrom`: DM izin listesi (kullanıcı kimlikleri). `open`, `"*"` gerektirir. Sihirbaz sayısal kimlikleri soracaktır.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist). Yapılandırmada bulunur; mevcut Marketplace botu davranışı için [Yetenekler](#capabilities) ve [Erişim denetimi (Gruplar)](#access-control-groups) bölümlerine bakın.
- `channels.zalo.groupAllowFrom`: grup gönderen izin listesi (kullanıcı kimlikleri). Ayarlanmadığında `allowFrom` değerine geri döner.
- `channels.zalo.mediaMaxMb`: gelen/giden medya sınırı (MB, varsayılan 5).
- `channels.zalo.webhookUrl`: Webhook modunu etkinleştirir (HTTPS gereklidir).
- `channels.zalo.webhookSecret`: Webhook secret'ı (8-256 karakter).
- `channels.zalo.webhookPath`: gateway HTTP sunucusundaki Webhook yolu.
- `channels.zalo.proxy`: API istekleri için proxy URL'si.

Çoklu hesap seçenekleri:

- `channels.zalo.accounts.<id>.botToken`: hesap başına token.
- `channels.zalo.accounts.<id>.tokenFile`: hesap başına normal token dosyası. Symlink'ler reddedilir.
- `channels.zalo.accounts.<id>.name`: görünen ad.
- `channels.zalo.accounts.<id>.enabled`: hesabı etkinleştir/devre dışı bırak.
- `channels.zalo.accounts.<id>.dmPolicy`: hesap başına DM politikası.
- `channels.zalo.accounts.<id>.allowFrom`: hesap başına izin listesi.
- `channels.zalo.accounts.<id>.groupPolicy`: hesap başına grup politikası. Yapılandırmada bulunur; mevcut Marketplace botu davranışı için [Yetenekler](#capabilities) ve [Erişim denetimi (Gruplar)](#access-control-groups) bölümlerine bakın.
- `channels.zalo.accounts.<id>.groupAllowFrom`: hesap başına grup gönderen izin listesi.
- `channels.zalo.accounts.<id>.webhookUrl`: hesap başına Webhook URL'si.
- `channels.zalo.accounts.<id>.webhookSecret`: hesap başına Webhook secret'ı.
- `channels.zalo.accounts.<id>.webhookPath`: hesap başına Webhook yolu.
- `channels.zalo.accounts.<id>.proxy`: hesap başına proxy URL'si.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
