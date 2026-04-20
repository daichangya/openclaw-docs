---
read_when:
    - DM erişim denetimi ayarlanıyor
    - Yeni bir iOS/Android Node eşleştirme
    - OpenClaw güvenlik duruşunu gözden geçirme
summary: 'Eşleştirmeye genel bakış: size kimlerin DM gönderebileceğini ve hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-20T09:03:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# Eşleştirme

“Eşleştirme”, OpenClaw’ın açık **sahip onayı** adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (botla konuşmasına izin verilen kişiler)
2. **Node eşleştirmesi** (gateway ağına katılmasına izin verilen cihazlar/node’lar)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal `pairing` DM ilkesiyle yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri şu belgede açıklanmıştır: [Güvenlik](/tr/gateway/security)

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra sona erer**. Bot eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak kanal başına **3** ile sınırlıdır; biri süresi dolana veya onaylanana kadar ek istekler yok sayılır.

### Bir göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Durumun bulunduğu yer

`~/.openclaw/credentials/` altında depolanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylı izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyalarını okur/yazar.
- Varsayılan hesap, kanal kapsamlı ve kapsamsız izin listesi dosyasını kullanır.

Bunları hassas veriler olarak değerlendirin (asistanınıza erişimi denetlerler).

Önemli: bu depo DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o gönderenin grup komutlarını çalıştırmasına veya gruplarda botu denetlemesine otomatik olarak izin vermez. Grup erişimi için kanalın açık grup izin listelerini yapılandırın (`groupAllowFrom`, `groups` veya kanala bağlı olarak grup/grup konusu başına geçersiz kılmalar gibi).

## 2) Node cihaz eşleştirmesi (iOS/Android/macOS/headless node’lar)

Node’lar Gateway’e `role: node` ile **cihaz** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram’da botunuza şu mesajı gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram’da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. Kurulum kodunu yapıştırın ve bağlanın.
5. Telegram’a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları gözden geçirin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL’si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan, kısa ömürlü tek cihazlık bir bootstrap token

Bu bootstrap token, yerleşik eşleştirme bootstrap profilini taşır:

- birincil olarak devredilen `node` token’ı `scopes: []` olarak kalır
- devredilen herhangi bir `operator` token’ı bootstrap izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap kapsam denetimleri tek bir düz kapsam havuzu değil, rol önekli yapılır:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine kendi rol önekleri altında kapsam istemelidir

Kurulum kodu geçerliyken ona parola gibi davranın.

### Bir node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

Önemli: zaten eşleştirilmiş bir cihaz daha geniş erişimi sessizce almaz. Daha
fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut
onayı olduğu gibi korur ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan
önce şu anda onaylı erişimi yeni istenen erişimle karşılaştırmak için
`openclaw devices list` kullanın.

### Node eşleştirme durumu depolaması

`~/.openclaw/devices/` altında depolanır:

- `pending.json` (kısa ömürlüdür; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + token’lar)

### Notlar

- Eski `node.pair.*` API’si (CLI: `openclaw nodes pending|approve|reject|rename`) ayrı
  bir gateway sahipli eşleştirme deposudur. WS node’ları yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylı roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz token’ları bu onaylı rol kümesiyle sınırlı kalır; onaylı rollerin dışında kalan
  başıboş bir token girdisi yeni erişim oluşturmaz.

## İlgili belgeler

- Güvenlik modeli + prompt injection: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/tr/channels/bluebubbles)
  - iMessage (eski): [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
